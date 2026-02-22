import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../home/presentation/widgets/feed_article_card.dart';
import '../bloc/tag_articles_bloc.dart';

class TagArticlesPage extends StatefulWidget {
  final String slug;
  final String name;

  const TagArticlesPage({
    super.key,
    required this.slug,
    required this.name,
  });

  @override
  State<TagArticlesPage> createState() => _TagArticlesPageState();
}

class _TagArticlesPageState extends State<TagArticlesPage> {
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
      final state = context.read<TagArticlesBloc>().state;
      if (state is TagArticlesLoaded && state.hasMore) {
        context.read<TagArticlesBloc>().add(
              LoadTagArticles(
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
        .read<TagArticlesBloc>()
        .add(RefreshTagArticles(slug: widget.slug));
    await context.read<TagArticlesBloc>().stream.firstWhere(
          (state) =>
              state is TagArticlesLoaded || state is TagArticlesError,
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          '# ${widget.name}',
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: BlocBuilder<TagArticlesBloc, TagArticlesState>(
        builder: (context, state) {
          if (state is TagArticlesLoading || state is TagArticlesInitial) {
            return _buildShimmer();
          }

          if (state is TagArticlesError) {
            return ErrorView(
              message: state.message,
              onRetry: () => context.read<TagArticlesBloc>().add(
                    LoadTagArticles(slug: widget.slug),
                  ),
            );
          }

          if (state is TagArticlesLoaded) {
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
    TagArticlesLoaded state,
  ) {
    if (state.articles.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.tag, size: 64, color: AppColors.textTertiary),
            const SizedBox(height: 16),
            Text(
              'no_tag_articles'.tr(),
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 16,
              ),
            ),
          ],
        ),
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
                context.push('/article/${article.slug}');
              },
            );
          }
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
