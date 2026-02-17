import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../home/presentation/widgets/feed_article_card.dart';
import '../bloc/favorites_bloc.dart';

/// Favorites & Reading History screen.
///
/// Two tabs:
/// 1. "מועדפים" (Favorites) — list of favorited articles with swipe-to-dismiss.
/// 2. "נקראו לאחרונה" (Recently Read) — list of reading history articles.
///
/// Each tab shows FeedArticleCard widgets with infinite scroll and
/// pull-to-refresh support.
class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key});

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_onTabChanged);
    context.read<FavoritesBloc>().add(const LoadFavorites());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _tabController
      ..removeListener(_onTabChanged)
      ..dispose();
    _scrollController
      ..removeListener(_onScroll)
      ..dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    if (_tabController.index == 0) {
      context.read<FavoritesBloc>().add(const LoadFavorites());
    } else {
      context.read<FavoritesBloc>().add(const SwitchToHistory());
    }
  }

  void _onScroll() {
    if (_isNearBottom) {
      final bloc = context.read<FavoritesBloc>();
      final currentState = bloc.state;
      if (currentState is FavoritesLoaded) {
        if (currentState.activeTab == FavoritesTab.favorites) {
          bloc.add(const LoadMoreFavorites());
        } else {
          bloc.add(const LoadMoreHistory());
        }
      }
    }
  }

  bool get _isNearBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    // Trigger when within 200px of the bottom.
    return currentScroll >= maxScroll - 200;
  }

  Future<void> _onRefresh() async {
    final bloc = context.read<FavoritesBloc>();
    if (_tabController.index == 0) {
      bloc.add(const LoadFavorites());
    } else {
      bloc.add(const LoadHistory());
    }
    // Wait for the state to change.
    await bloc.stream.firstWhere(
      (state) => state is FavoritesLoaded || state is FavoritesError,
    );
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'favorites'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.likudBlue,
          indicatorWeight: 3,
          labelColor: AppColors.likudBlue,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          tabs: [
            Tab(text: 'tab_favorites'.tr()),
            Tab(text: 'tab_recently_read'.tr()),
          ],
        ),
      ),
      body: BlocBuilder<FavoritesBloc, FavoritesState>(
        builder: (context, state) {
          if (state is FavoritesLoading || state is FavoritesInitial) {
            return _buildLoadingState();
          }

          if (state is FavoritesError) {
            return ErrorView(
              message: state.message,
              onRetry: () {
                if (_tabController.index == 0) {
                  context.read<FavoritesBloc>().add(const LoadFavorites());
                } else {
                  context.read<FavoritesBloc>().add(const LoadHistory());
                }
              },
            );
          }

          if (state is FavoritesLoaded) {
            return _buildLoadedState(context, state);
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(
        children: List.generate(
          6,
          (_) => const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                ShimmerLoading(width: 120, height: 80, borderRadius: 8),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ShimmerLoading(height: 14, borderRadius: 4),
                      SizedBox(height: 8),
                      ShimmerLoading(height: 14, borderRadius: 4),
                      SizedBox(height: 8),
                      ShimmerLoading(
                        width: 100,
                        height: 10,
                        borderRadius: 4,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadedState(BuildContext context, FavoritesLoaded state) {
    if (state.articles.isEmpty) {
      return _buildEmptyState(state.activeTab);
    }

    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: AppColors.likudBlue,
      child: ListView.builder(
        controller: _scrollController,
        itemCount: state.articles.length + (state.hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= state.articles.length) {
            // Loading indicator at the bottom.
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: AppColors.likudBlue,
                  ),
                ),
              ),
            );
          }

          final article = state.articles[index];
          final card = Column(
            children: [
              FeedArticleCard(
                article: article,
                onTap: () {
                  context.push('/article/${article.slug ?? article.id}');
                },
              ),
              if (index < state.articles.length - 1)
                const Divider(
                  height: 1,
                  indent: 16,
                  endIndent: 16,
                  color: AppColors.border,
                ),
            ],
          );

          // Favorites tab supports swipe-to-dismiss.
          if (state.activeTab == FavoritesTab.favorites) {
            return Dismissible(
              key: ValueKey(article.id),
              direction: DismissDirection.endToStart,
              background: Container(
                alignment: Alignment.centerLeft,
                padding: const EdgeInsets.only(left: 24),
                color: AppColors.breakingRed,
                child: const Icon(
                  Icons.delete_outline,
                  color: AppColors.white,
                  size: 28,
                ),
              ),
              onDismissed: (_) {
                context
                    .read<FavoritesBloc>()
                    .add(RemoveFavorite(article.id));
              },
              child: card,
            );
          }

          return card;
        },
      ),
    );
  }

  Widget _buildEmptyState(FavoritesTab activeTab) {
    if (activeTab == FavoritesTab.favorites) {
      return EmptyView(
        message: 'no_favorites'.tr(),
        icon: Icons.favorite_border,
      );
    }
    return EmptyView(
      message: 'no_history'.tr(),
      icon: Icons.history,
    );
  }
}
