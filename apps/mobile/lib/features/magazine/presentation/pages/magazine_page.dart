import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../home/presentation/widgets/feed_article_card.dart';
import '../bloc/magazine_bloc.dart';
import '../widgets/featured_magazine_card.dart';

/// Magazine screen of the Metzudat HaLikud news app.
///
/// Composed of:
/// 1. Featured/hero magazine article card at top (full-width image).
/// 2. Article list below using FeedArticleCard widgets.
/// Supports infinite scroll and pull-to-refresh.
/// Uses magazine-style typography (larger title fonts).
class MagazinePage extends StatefulWidget {
  const MagazinePage({super.key});

  @override
  State<MagazinePage> createState() => _MagazinePageState();
}

class _MagazinePageState extends State<MagazinePage> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    context.read<MagazineBloc>().add(const LoadMagazine());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_onScroll)
      ..dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isNearBottom) {
      context.read<MagazineBloc>().add(const LoadMoreMagazine());
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
    context.read<MagazineBloc>().add(const RefreshMagazine());
    // Wait for the state to change from the current loaded state.
    await context.read<MagazineBloc>().stream.firstWhere(
          (state) => state is MagazineLoaded || state is MagazineError,
        );
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'magazine'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: BlocBuilder<MagazineBloc, MagazineState>(
        builder: (context, state) {
          if (state is MagazineLoading || state is MagazineInitial) {
            return _buildLoadingState();
          }

          if (state is MagazineError) {
            return ErrorView(
              message: state.message,
              onRetry: () =>
                  context.read<MagazineBloc>().add(const LoadMagazine()),
            );
          }

          if (state is MagazineLoaded) {
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
        children: [
          // Featured article shimmer.
          const ShimmerLoading(height: 300, borderRadius: 0),
          const SizedBox(height: 16),
          // Article cards shimmer.
          ...List.generate(
            5,
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
        ],
      ),
    );
  }

  Widget _buildLoadedState(BuildContext context, MagazineLoaded state) {
    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: AppColors.likudBlue,
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // Featured magazine article.
          if (state.featuredArticle != null)
            SliverToBoxAdapter(
              child: FeaturedMagazineCard(
                article: state.featuredArticle!,
                onTap: () {
                  context.push('/article/${state.featuredArticle!.slug ?? state.featuredArticle!.id}');
                },
              ),
            ),

          // Section header.
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 4),
              child: Text(
                'מגזין',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.3,
                ),
              ),
            ),
          ),

          // Article list.
          if (state.articles.isEmpty)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Center(
                  child: Text(
                    'אין כתבות מגזין להצגה',
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
            )
          else
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  if (index < state.articles.length) {
                    final article = state.articles[index];
                    return Column(
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
                  }
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
                },
                childCount:
                    state.articles.length + (state.hasMore ? 1 : 0),
              ),
            ),

          // Bottom padding.
          const SliverPadding(padding: EdgeInsets.only(bottom: 80)),
        ],
      ),
    );
  }
}
