import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../home/presentation/widgets/feed_article_card.dart';
import '../bloc/categories_bloc.dart';
import '../widgets/category_card.dart';

/// Categories grid page.
///
/// Displays all active categories in a 2-column grid layout.
/// Each card shows the category icon, name, and a colored accent.
/// Tapping a card navigates to the category articles view.
class CategoriesPage extends StatefulWidget {
  const CategoriesPage({super.key});

  @override
  State<CategoriesPage> createState() => _CategoriesPageState();
}

class _CategoriesPageState extends State<CategoriesPage> {
  @override
  void initState() {
    super.initState();
    context.read<CategoriesBloc>().add(const LoadCategories());
  }

  Future<void> _onRefresh() async {
    context.read<CategoriesBloc>().add(const LoadCategories());
    await context.read<CategoriesBloc>().stream.firstWhere(
          (state) => state is CategoriesLoaded || state is CategoriesError,
        );
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'categories'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: BlocBuilder<CategoriesBloc, CategoriesState>(
        builder: (context, state) {
          if (state is CategoriesLoading || state is CategoriesInitial) {
            return _buildLoadingState();
          }

          if (state is CategoriesError) {
            return ErrorView(
              message: state.message,
              onRetry: () =>
                  context.read<CategoriesBloc>().add(const LoadCategories()),
            );
          }

          if (state is CategoriesLoaded) {
            return _buildLoadedState(context, state);
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.2,
      ),
      itemCount: 6,
      itemBuilder: (_, __) => const ShimmerLoading(
        borderRadius: 12,
      ),
    );
  }

  Widget _buildLoadedState(BuildContext context, CategoriesLoaded state) {
    if (state.categories.isEmpty) {
      return EmptyView(
        message: 'no_categories'.tr(),
        icon: Icons.category_outlined,
      );
    }

    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: AppColors.likudBlue,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.2,
        ),
        itemCount: state.categories.length,
        itemBuilder: (context, index) {
          final category = state.categories[index];
          return CategoryCard(
            category: category,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => BlocProvider.value(
                    value: context.read<CategoriesBloc>()
                      ..add(LoadCategoryArticles(
                        slug: category.slug ?? '',
                      )),
                    child: _CategoryArticlesRoute(
                      slug: category.slug ?? '',
                      name: category.name,
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

/// Internal route wrapper for category articles page.
///
/// Imported lazily so the categories_page.dart file doesn't have a
/// circular dependency.
class _CategoryArticlesRoute extends StatelessWidget {
  final String slug;
  final String name;

  const _CategoryArticlesRoute({
    required this.slug,
    required this.name,
  });

  @override
  Widget build(BuildContext context) {
    // Lazy-import to avoid circular dependency at file level.
    // The actual CategoryArticlesPage is in the widgets directory.
    return _LazyArticlesPage(slug: slug, name: name);
  }
}

class _LazyArticlesPage extends StatelessWidget {
  final String slug;
  final String name;

  const _LazyArticlesPage({required this.slug, required this.name});

  @override
  Widget build(BuildContext context) {
    // Import the category articles page widget.
    // We inline the import to the presentation/widgets directory.
    return _CategoryArticlesPageInline(slug: slug, name: name);
  }
}

/// Inline category articles page to avoid circular imports.
///
/// Shows articles filtered by category, reuses FeedArticleCard,
/// supports infinite scroll and pull-to-refresh.
class _CategoryArticlesPageInline extends StatefulWidget {
  final String slug;
  final String name;

  const _CategoryArticlesPageInline({
    required this.slug,
    required this.name,
  });

  @override
  State<_CategoryArticlesPageInline> createState() =>
      _CategoryArticlesPageInlineState();
}

class _CategoryArticlesPageInlineState
    extends State<_CategoryArticlesPageInline> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
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
      final state = context.read<CategoriesBloc>().state;
      if (state is CategoryArticlesLoaded && state.hasMore) {
        context.read<CategoriesBloc>().add(
              LoadCategoryArticles(
                slug: widget.slug,
                page: state.currentPage + 1,
              ),
            );
      }
    }
  }

  bool get _isNearBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    return currentScroll >= maxScroll - 200;
  }

  Future<void> _onRefresh() async {
    context
        .read<CategoriesBloc>()
        .add(RefreshCategoryArticles(slug: widget.slug));
    await context.read<CategoriesBloc>().stream.firstWhere(
          (state) =>
              state is CategoryArticlesLoaded || state is CategoriesError,
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          widget.name,
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: BlocBuilder<CategoriesBloc, CategoriesState>(
        builder: (context, state) {
          if (state is CategoriesLoading || state is CategoriesInitial) {
            return _buildShimmer();
          }

          if (state is CategoriesError) {
            return ErrorView(
              message: state.message,
              onRetry: () => context.read<CategoriesBloc>().add(
                    LoadCategoryArticles(slug: widget.slug),
                  ),
            );
          }

          if (state is CategoryArticlesLoaded) {
            return _buildArticlesList(context, state);
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildShimmer() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 5,
      itemBuilder: (_, __) => const Padding(
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
                  ShimmerLoading(width: 100, height: 10, borderRadius: 4),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildArticlesList(
    BuildContext context,
    CategoryArticlesLoaded state,
  ) {
    if (state.articles.isEmpty) {
      return EmptyView(
        message: 'no_articles_in_category'.tr(),
        icon: Icons.article_outlined,
      );
    }

    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: AppColors.likudBlue,
      child: ListView.separated(
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(vertical: 8),
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: state.articles.length + (state.hasMore ? 1 : 0),
        separatorBuilder: (_, __) => const Divider(
          height: 1,
          indent: 16,
          endIndent: 16,
          color: AppColors.border,
        ),
        itemBuilder: (context, index) {
          if (index < state.articles.length) {
            final article = state.articles[index];
            return FeedArticleCard(
              article: article,
              onTap: () {
                // TODO: navigate to article detail.
              },
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
      ),
    );
  }
}
