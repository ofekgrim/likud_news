import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../home/domain/entities/category.dart';
import '../../../home/presentation/widgets/feed_article_card.dart';
import '../bloc/search_bloc.dart';
import '../widgets/search_suggestion_chips.dart';

/// Full-screen search page.
///
/// Layout:
/// - Search text field with search icon and clear button
/// - Category filter chips (when categories are loaded)
/// - Recent searches list (when idle)
/// - Popular hashtag suggestion chips
/// - Search results list with FeedArticleCard
/// - Infinite scroll and pull-to-refresh support
class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController
      ..removeListener(_onScroll)
      ..dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isNearBottom) {
      context.read<SearchBloc>().add(const LoadMoreSearchResults());
    }
  }

  bool get _isNearBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    return currentScroll >= maxScroll - 200;
  }

  void _onQueryChanged(String query) {
    context.read<SearchBloc>().add(SearchQueryChanged(query));
  }

  void _onClear() {
    _searchController.clear();
    context.read<SearchBloc>().add(const ClearSearch());
    _focusNode.requestFocus();
  }

  void _onSuggestionTap(String suggestion) {
    _searchController.text = suggestion;
    _searchController.selection = TextSelection.fromPosition(
      TextPosition(offset: suggestion.length),
    );
    context.read<SearchBloc>().add(SearchQueryChanged(suggestion));
  }

  void _onRecentSearchTap(String query) {
    _searchController.text = query;
    _searchController.selection = TextSelection.fromPosition(
      TextPosition(offset: query.length),
    );
    context.read<SearchBloc>().add(SearchQueryChanged(query));
  }

  void _onCategoryFilterTap(String? categoryId) {
    context.read<SearchBloc>().add(CategoryFilterChanged(categoryId));
  }

  /// Extracts categories and selectedCategoryId from the current state.
  ({List<Category> categories, String? selectedCategoryId}) _extractCategoryInfo(
    SearchState state,
  ) {
    return switch (state) {
      SearchInitial(:final categories) => (
          categories: categories,
          selectedCategoryId: null,
        ),
      SearchLoading(:final categories, :final selectedCategoryId) => (
          categories: categories,
          selectedCategoryId: selectedCategoryId,
        ),
      SearchLoaded(:final categories, :final selectedCategoryId) => (
          categories: categories,
          selectedCategoryId: selectedCategoryId,
        ),
      SearchEmpty(:final categories, :final selectedCategoryId) => (
          categories: categories,
          selectedCategoryId: selectedCategoryId,
        ),
      SearchError(:final categories, :final selectedCategoryId) => (
          categories: categories,
          selectedCategoryId: selectedCategoryId,
        ),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.surfaceVariant,
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchField(),
            BlocBuilder<SearchBloc, SearchState>(
              buildWhen: (previous, current) {
                final prevInfo = _extractCategoryInfo(previous);
                final currInfo = _extractCategoryInfo(current);
                return prevInfo.categories != currInfo.categories ||
                    prevInfo.selectedCategoryId != currInfo.selectedCategoryId;
              },
              builder: (context, state) {
                final info = _extractCategoryInfo(state);
                if (info.categories.isEmpty) {
                  return const SizedBox.shrink();
                }
                return _buildCategoryFilterChips(
                  info.categories,
                  info.selectedCategoryId,
                );
              },
            ),
            Expanded(
              child: BlocBuilder<SearchBloc, SearchState>(
                builder: (context, state) {
                  return switch (state) {
                    SearchInitial() => _buildInitialState(state),
                    SearchLoading() => _buildLoadingState(),
                    SearchLoaded() => _buildLoadedState(context, state),
                    SearchEmpty() => _buildEmptyState(state),
                    SearchError() => ErrorView(
                        message: state.message,
                        onRetry: () {
                          final query = _searchController.text.trim();
                          if (query.isNotEmpty) {
                            context
                                .read<SearchBloc>()
                                .add(SearchQueryChanged(query));
                          }
                        },
                      ),
                  };
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Horizontal scrollable row of category filter chips.
  Widget _buildCategoryFilterChips(
    List<Category> categories,
    String? selectedCategoryId,
  ) {
    final isAllSelected = selectedCategoryId == null;

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 8),
        itemCount: categories.length + 1, // +1 for the "All" chip
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          if (index == 0) {
            // "All" chip
            return FilterChip(
              label: Text('all_categories_filter'.tr()),
              selected: isAllSelected,
              onSelected: (_) => _onCategoryFilterTap(null),
              labelStyle: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                fontWeight:
                    isAllSelected ? FontWeight.w600 : FontWeight.w400,
                color: isAllSelected
                    ? AppColors.white
                    : context.colors.textSecondary,
              ),
              selectedColor: AppColors.likudBlue,
              backgroundColor: context.colors.surface,
              side: BorderSide(
                color:
                    isAllSelected ? AppColors.likudBlue : context.colors.border,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              showCheckmark: false,
              padding: const EdgeInsets.symmetric(horizontal: 4),
            );
          }

          final category = categories[index - 1];
          final isSelected = selectedCategoryId == category.id;

          return FilterChip(
            label: Text(category.name),
            selected: isSelected,
            onSelected: (_) => _onCategoryFilterTap(category.id),
            labelStyle: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              color: isSelected
                  ? AppColors.white
                  : context.colors.textSecondary,
            ),
            selectedColor: AppColors.likudBlue,
            backgroundColor: context.colors.surface,
            side: BorderSide(
              color: isSelected ? AppColors.likudBlue : context.colors.border,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            showCheckmark: false,
            padding: const EdgeInsets.symmetric(horizontal: 4),
          );
        },
      ),
    );
  }

  /// Search text field with search icon and clear button.
  Widget _buildSearchField() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: TextField(
        controller: _searchController,
        focusNode: _focusNode,
        onChanged: _onQueryChanged,
        textDirection: TextDirection.rtl,
        style: TextStyle(
          fontFamily: 'Heebo',
          fontSize: 16,
          color: context.colors.textPrimary,
        ),
        decoration: InputDecoration(
          hintText: 'search_hint'.tr(),
          hintStyle: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 16,
            color: context.colors.textTertiary,
          ),
          prefixIcon: Icon(
            Icons.search,
            color: context.colors.textTertiary,
          ),
          suffixIcon: BlocBuilder<SearchBloc, SearchState>(
            builder: (context, state) {
              if (state is! SearchInitial) {
                return IconButton(
                  icon: Icon(
                    Icons.clear,
                    color: context.colors.textSecondary,
                  ),
                  onPressed: _onClear,
                );
              }
              return const SizedBox.shrink();
            },
          ),
          filled: true,
          fillColor: context.colors.surface,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: context.colors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: context.colors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(
              color: AppColors.likudBlue,
              width: 1.5,
            ),
          ),
        ),
      ),
    );
  }

  /// Initial state: recent searches + suggestion chips.
  Widget _buildInitialState(SearchInitial state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      physics: const AlwaysScrollableScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Recent searches.
          if (state.recentSearches.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text(
              'recent_searches'.tr(),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: context.colors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            ...state.recentSearches.map(
              (query) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: Icon(
                  Icons.history,
                  size: 20,
                  color: context.colors.textTertiary,
                ),
                title: Text(
                  query,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    color: context.colors.textSecondary,
                  ),
                ),
                onTap: () => _onRecentSearchTap(query),
              ),
            ),
            Divider(color: context.colors.border),
          ],

          // Popular hashtag chips.
          const SizedBox(height: 16),
          Text(
            'popular_topics'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: context.colors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          SearchSuggestionChips(
            suggestions: const [],
            onChipTap: _onSuggestionTap,
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  /// Loading state: shimmer placeholders.
  Widget _buildLoadingState() {
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

  /// Loaded state: search results list with infinite scroll.
  Widget _buildLoadedState(BuildContext context, SearchLoaded state) {
    return RefreshIndicator(
      onRefresh: () async {
        context
            .read<SearchBloc>()
            .add(SearchQueryChanged(state.query));
        await context.read<SearchBloc>().stream.firstWhere(
              (s) => s is SearchLoaded || s is SearchEmpty || s is SearchError,
            );
      },
      color: AppColors.likudBlue,
      child: ListView.separated(
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(vertical: 8),
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: state.articles.length + (state.hasMore ? 1 : 0),
        separatorBuilder: (_, __) => Divider(
          height: 1,
          indent: 16,
          endIndent: 16,
          color: context.colors.border,
        ),
        itemBuilder: (context, index) {
          if (index < state.articles.length) {
            final article = state.articles[index];
            return FeedArticleCard(
              article: article,
              onTap: () {
                context.push('/article/${article.slug ?? article.id}');
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

  /// Empty state: no results found.
  Widget _buildEmptyState(SearchEmpty state) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.search_off,
              size: 64,
              color: context.colors.textTertiary,
            ),
            const SizedBox(height: 16),
            Text(
              'no_results'.tr(),
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontFamily: 'Heebo',
                    fontWeight: FontWeight.w600,
                    color: context.colors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'try_different_search'.tr(args: [state.query]),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                color: context.colors.textTertiary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
