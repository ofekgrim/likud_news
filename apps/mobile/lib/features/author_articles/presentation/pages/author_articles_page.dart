import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../article_detail/domain/entities/author.dart';
import '../../../home/presentation/widgets/feed_article_card.dart';
import '../bloc/author_articles_bloc.dart';

class AuthorArticlesPage extends StatefulWidget {
  final String authorId;

  const AuthorArticlesPage({super.key, required this.authorId});

  @override
  State<AuthorArticlesPage> createState() => _AuthorArticlesPageState();
}

class _AuthorArticlesPageState extends State<AuthorArticlesPage> {
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
      final state = context.read<AuthorArticlesBloc>().state;
      if (state is AuthorArticlesLoaded && state.hasMore) {
        context.read<AuthorArticlesBloc>().add(
              LoadAuthorArticles(
                authorId: widget.authorId,
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
        .read<AuthorArticlesBloc>()
        .add(RefreshAuthorArticles(authorId: widget.authorId));
    await context.read<AuthorArticlesBloc>().stream.firstWhere(
          (state) =>
              state is AuthorArticlesLoaded || state is AuthorArticlesError,
        );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          centerTitle: true,
          title: Text(
            'author_articles'.tr(),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        body: BlocBuilder<AuthorArticlesBloc, AuthorArticlesState>(
          builder: (context, state) {
            if (state is AuthorArticlesLoading ||
                state is AuthorArticlesInitial) {
              return _buildShimmer();
            }

            if (state is AuthorArticlesError) {
              return ErrorView(
                message: state.message,
                onRetry: () => context.read<AuthorArticlesBloc>().add(
                      LoadAuthorArticles(authorId: widget.authorId),
                    ),
              );
            }

            if (state is AuthorArticlesLoaded) {
              return _buildContent(context, state);
            }

            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      physics: const NeverScrollableScrollPhysics(),
      children: [
        // Author header shimmer
        const Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            children: [
              ShimmerLoading(width: 64, height: 64, borderRadius: 32),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShimmerLoading(width: 150, height: 16, borderRadius: 4),
                    SizedBox(height: 8),
                    ShimmerLoading(width: 100, height: 12, borderRadius: 4),
                  ],
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1, color: AppColors.border),
        // Article list shimmer
        for (var i = 0; i < 5; i++)
          const Padding(
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
      ],
    );
  }

  Widget _buildAuthorHeader(Author author) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              // Avatar
              _buildAvatar(author),
              const SizedBox(width: 16),
              // Name + role
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      author.nameHe,
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (author.roleHe != null && author.roleHe!.isNotEmpty)
                      Text(
                        author.roleHe!,
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 14,
                          color: AppColors.textSecondary,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          // Bio
          if (author.bioHe != null && author.bioHe!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              author.bioHe!,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                height: 1.5,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAvatar(Author author) {
    final hasAvatar = author.avatarUrl != null && author.avatarUrl!.isNotEmpty;

    if (hasAvatar) {
      return ClipOval(
        child: AppCachedImage(
          imageUrl: author.avatarUrl!,
          width: 64,
          height: 64,
          fit: BoxFit.cover,
        ),
      );
    }

    return CircleAvatar(
      radius: 32,
      backgroundColor: AppColors.likudBlue.withValues(alpha: 0.1),
      child: Text(
        author.nameHe.isNotEmpty ? author.nameHe[0] : '?',
        style: const TextStyle(
          fontFamily: 'Heebo',
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: AppColors.likudBlue,
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, AuthorArticlesLoaded state) {
    if (state.articles.isEmpty) {
      return Column(
        children: [
          _buildAuthorHeader(state.author),
          const Divider(height: 1, color: AppColors.border),
          Expanded(
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.article_outlined,
                      size: 64, color: AppColors.textTertiary),
                  const SizedBox(height: 16),
                  Text(
                    'no_author_articles'.tr(),
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: AppColors.likudBlue,
      child: CustomScrollView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // Author header
          SliverToBoxAdapter(
            child: _buildAuthorHeader(state.author),
          ),
          SliverToBoxAdapter(
            child: Divider(height: 1, color: AppColors.border),
          ),
          // Articles
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
                          context.push('/article/${article.slug}');
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
                // Loading indicator for pagination
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
        ],
      ),
    );
  }
}
