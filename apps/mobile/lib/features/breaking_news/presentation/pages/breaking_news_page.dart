import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../bloc/breaking_news_bloc.dart';
import '../widgets/breaking_news_card.dart';
import '../widgets/live_indicator.dart';

/// Full-screen breaking news page.
///
/// Layout:
/// - "דסק החדשות" header with [LiveIndicator]
/// - Tab bar: "מבזקים" (breaking only) / "לכל הכתבות" (all articles)
/// - SSE-connected auto-updating list of [BreakingNewsCard]s
class BreakingNewsPage extends StatefulWidget {
  const BreakingNewsPage({super.key});

  @override
  State<BreakingNewsPage> createState() => _BreakingNewsPageState();
}

class _BreakingNewsPageState extends State<BreakingNewsPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_onTabChanged);
    context.read<BreakingNewsBloc>().add(const LoadBreakingNews());
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      setState(() {});
      if (_tabController.index == 1) {
        context.read<BreakingNewsBloc>().add(const LoadAllArticles());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceLight,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildSearchField(),
            _buildTabBar(),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  /// Search text field between header and tab bar.
  Widget _buildSearchField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: TextField(
        controller: _searchController,
        onChanged: (value) => setState(() => _searchQuery = value.toLowerCase()),
        textDirection: TextDirection.rtl,
        style: const TextStyle(fontFamily: 'Heebo', fontSize: 14),
        decoration: InputDecoration(
          hintText: (_tabController.index == 0 ? 'search_breaking_hint' : 'search_all_articles_hint').tr(),
          hintStyle: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 14,
            color: AppColors.textTertiary,
          ),
          prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary, size: 20),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                  },
                )
              : null,
          filled: true,
          fillColor: AppColors.surfaceMedium,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        ),
      ),
    );
  }

  /// Header row: "דסק החדשות" + live indicator dot.
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => AppRouter.scaffoldKey.currentState?.openDrawer(),
            color: AppColors.textPrimary,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
          const SizedBox(width: 8),
          BlocSelector<BreakingNewsBloc, BreakingNewsState, bool>(
            selector: (state) =>
                state is BreakingNewsLoaded && state.isLive,
            builder: (context, isLive) {
              return LiveIndicator(isLive: isLive);
            },
          ),
          const SizedBox(width: 10),
          Text(
            'news_desk'.tr(),
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const Spacer(),
          // Refresh button
          IconButton(
            icon: const Icon(Icons.refresh, size: 22),
            color: AppColors.textSecondary,
            onPressed: () {
              context.read<BreakingNewsBloc>().add(const RefreshBreaking());
            },
            tooltip: 'refresh'.tr(),
          ),
        ],
      ),
    );
  }

  /// Tab bar with "מבזקים" and "לכל הכתבות".
  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: AppColors.surfaceMedium,
        borderRadius: BorderRadius.circular(10),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: AppColors.likudBlue,
          borderRadius: BorderRadius.circular(10),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        labelColor: AppColors.white,
        unselectedLabelColor: AppColors.textSecondary,
        labelStyle: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
        unselectedLabelStyle: Theme.of(context).textTheme.titleMedium,
        tabs: [
          Tab(text: 'tab_breaking'.tr()),
          Tab(text: 'tab_all_articles'.tr()),
        ],
      ),
    );
  }

  /// Main body: tab view with BLoC-driven content.
  Widget _buildBody() {
    return TabBarView(
      controller: _tabController,
      children: [
        // Tab 1 - Breaking only
        _BreakingList(breakingOnly: true, searchQuery: _searchQuery),
        // Tab 2 - All published articles with pagination
        _AllArticlesList(searchQuery: _searchQuery),
      ],
    );
  }
}

/// Internal list widget driven by [BreakingNewsBloc].
///
/// When [breakingOnly] is true, filters to only articles where
/// [Article.isBreaking] is true. Otherwise shows all articles.
/// When [searchQuery] is non-empty, additionally filters by title/subtitle/slug.
class _BreakingList extends StatelessWidget {
  final bool breakingOnly;
  final String searchQuery;

  const _BreakingList({required this.breakingOnly, this.searchQuery = ''});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<BreakingNewsBloc, BreakingNewsState>(
      builder: (context, state) {
        return switch (state) {
          BreakingNewsInitial() => const SizedBox.shrink(),
          BreakingNewsLoading() => _buildShimmer(),
          BreakingNewsError(:final message) => ErrorView(
              message: message,
              onRetry: () {
                context
                    .read<BreakingNewsBloc>()
                    .add(const LoadBreakingNews());
              },
            ),
          BreakingNewsLoaded(:final articles) => () {
              var filtered = breakingOnly
                  ? articles.where((a) => a.isBreaking).toList()
                  : articles;

              if (searchQuery.isNotEmpty) {
                final q = searchQuery;
                filtered = filtered.where((a) {
                  return a.title.toLowerCase().contains(q) ||
                      (a.subtitle?.toLowerCase().contains(q) ?? false) ||
                      (a.slug?.toLowerCase().contains(q) ?? false) ||
                      (a.categoryName?.toLowerCase().contains(q) ?? false) ||
                      a.hashtags.any((tag) => tag.toLowerCase().contains(q));
                }).toList();
              }

              if (filtered.isEmpty) {
                return EmptyView(
                  message: 'no_breaking'.tr(),
                  icon: Icons.newspaper_outlined,
                );
              }

              return RefreshIndicator(
                color: AppColors.likudBlue,
                onRefresh: () async {
                  context
                      .read<BreakingNewsBloc>()
                      .add(const RefreshBreaking());
                  // Wait a brief moment for the BLoC to process.
                  await Future<void>.delayed(
                    const Duration(milliseconds: 500),
                  );
                },
                child: ListView.separated(
                  padding: EdgeInsetsDirectional.only(
                    start: 16,
                    end: 16,
                    top: 16,
                    bottom: AppRouter.bottomNavClearance(context),
                  ),
                  physics: const AlwaysScrollableScrollPhysics(),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final article = filtered[index];
                    return BreakingNewsCard(
                      article: article,
                      onTap: () {
                        context.push('/article/${article.slug ?? article.id}');
                      },
                    );
                  },
                ),
              );
            }(),
        };
      },
    );
  }

  Widget _buildShimmer() {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, __) => const ShimmerArticleCard(),
    );
  }
}

/// Tab 2: All published articles with "show more" pagination.
/// When [searchQuery] is non-empty, filters by title/subtitle/slug.
class _AllArticlesList extends StatelessWidget {
  final String searchQuery;

  const _AllArticlesList({this.searchQuery = ''});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<BreakingNewsBloc, BreakingNewsState>(
      builder: (context, state) {
        if (state is! BreakingNewsLoaded) {
          return _buildShimmer();
        }

        var articles = state.allArticles;

        if (searchQuery.isNotEmpty) {
          final q = searchQuery;
          articles = articles.where((a) {
            return a.title.toLowerCase().contains(q) ||
                (a.subtitle?.toLowerCase().contains(q) ?? false) ||
                (a.slug?.toLowerCase().contains(q) ?? false) ||
                (a.categoryName?.toLowerCase().contains(q) ?? false) ||
                a.hashtags.any((tag) => tag.toLowerCase().contains(q));
          }).toList();
        }

        if (articles.isEmpty && state.allArticlesPage == 0) {
          // Not yet loaded — show shimmer
          return _buildShimmer();
        }

        if (articles.isEmpty) {
          return EmptyView(
            message: 'no_all_articles'.tr(),
            icon: Icons.article_outlined,
          );
        }

        return RefreshIndicator(
          color: AppColors.likudBlue,
          onRefresh: () async {
            context.read<BreakingNewsBloc>().add(const RefreshBreaking());
            await Future<void>.delayed(const Duration(milliseconds: 500));
          },
          child: ListView.separated(
            padding: EdgeInsetsDirectional.only(
              start: 16,
              end: 16,
              top: 16,
              bottom: AppRouter.bottomNavClearance(context),
            ),
            physics: const AlwaysScrollableScrollPhysics(),
            itemCount: articles.length + (state.allArticlesHasMore ? 1 : 0),
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              if (index < articles.length) {
                final article = articles[index];
                return BreakingNewsCard(
                  article: article,
                  onTap: () {
                    context.push('/article/${article.slug ?? article.id}');
                  },
                );
              }
              // "Show more" button at the bottom
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () {
                      context.read<BreakingNewsBloc>().add(const LoadMoreAllArticles());
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.likudBlue,
                      side: const BorderSide(color: AppColors.likudBlue),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      'show_more'.tr(),
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildShimmer() {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, __) => const ShimmerArticleCard(),
    );
  }
}
