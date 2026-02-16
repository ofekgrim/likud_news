import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../bloc/article_detail_bloc.dart';
import '../widgets/article_actions_bar.dart';
import '../widgets/article_content.dart';
import '../widgets/article_header.dart';
import '../widgets/hashtag_chips.dart';
import '../widgets/related_articles.dart';

/// Full-screen article detail page.
///
/// Expects an [ArticleDetailBloc] to be provided above this widget.
/// Loads the article by slug and displays the hero header, HTML body,
/// hashtags, related articles, and the share/bookmark action bar.
class ArticleDetailPage extends StatelessWidget {
  final String slug;

  const ArticleDetailPage({super.key, required this.slug});

  @override
  Widget build(BuildContext context) {
    // Dispatch load event when the page builds for the first time.
    // The BLoC will de-duplicate if already loading.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final bloc = context.read<ArticleDetailBloc>();
      if (bloc.state is ArticleDetailInitial) {
        bloc.add(LoadArticleDetail(slug));
      }
    });

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: BlocBuilder<ArticleDetailBloc, ArticleDetailState>(
          builder: (context, state) {
            return switch (state) {
              ArticleDetailInitial() ||
              ArticleDetailLoading() =>
                const Center(
                  child: CircularProgressIndicator(
                    color: AppColors.likudBlue,
                  ),
                ),
              ArticleDetailError(:final message) => ErrorView(
                  message: message,
                  onRetry: () => context
                      .read<ArticleDetailBloc>()
                      .add(LoadArticleDetail(slug)),
                ),
              ArticleDetailLoaded(:final article) => Column(
                  children: [
                    Expanded(
                      child: CustomScrollView(
                        slivers: [
                          // Collapsing app bar with back button
                          SliverAppBar(
                            expandedHeight: 360,
                            pinned: true,
                            stretch: true,
                            backgroundColor: AppColors.likudDarkBlue,
                            leading: _BackButton(),
                            flexibleSpace: FlexibleSpaceBar(
                              background: ArticleHeader(article: article),
                              collapseMode: CollapseMode.parallax,
                            ),
                          ),

                          // Body content
                          SliverToBoxAdapter(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Hero image caption
                                if (article.heroImageCaption != null &&
                                    article.heroImageCaption!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(
                                        16, 12, 16, 0),
                                    child: Text(
                                      article.heroImageCaption!,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            color: AppColors.textTertiary,
                                            fontStyle: FontStyle.italic,
                                          ),
                                    ),
                                  ),

                                // HTML content
                                if (article.content != null &&
                                    article.content!.isNotEmpty)
                                  ArticleContent(
                                      htmlContent: article.content!),

                                const SizedBox(height: 16),

                                // Hashtag chips
                                HashtagChips(
                                  hashtags: article.hashtags,
                                  onHashtagTap: (tag) {
                                    // Navigate to search/filter by hashtag.
                                    // Placeholder: can be wired up to router.
                                  },
                                ),

                                const SizedBox(height: 24),

                                // Divider before related
                                if (article.relatedArticles.isNotEmpty)
                                  const Divider(
                                    height: 1,
                                    indent: 16,
                                    endIndent: 16,
                                    color: AppColors.border,
                                  ),

                                if (article.relatedArticles.isNotEmpty)
                                  const SizedBox(height: 20),

                                // Related articles
                                RelatedArticles(
                                  articles: article.relatedArticles,
                                  onArticleTap: (related) {
                                    if (related.slug != null) {
                                      Navigator.of(context).pushReplacement(
                                        MaterialPageRoute<void>(
                                          builder: (_) =>
                                              BlocProvider.value(
                                            value: context
                                                .read<ArticleDetailBloc>()
                                              ..add(LoadArticleDetail(
                                                  related.slug!)),
                                            child: ArticleDetailPage(
                                                slug: related.slug!),
                                          ),
                                        ),
                                      );
                                    }
                                  },
                                ),

                                const SizedBox(height: 24),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Bottom action bar
                    const ArticleActionsBar(),
                  ],
                ),
            };
          },
        ),
      ),
    );
  }
}

/// Circular back button with semi-transparent background.
class _BackButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: CircleAvatar(
        backgroundColor: AppColors.black.withValues(alpha: 0.35),
        radius: 18,
        child: IconButton(
          padding: EdgeInsets.zero,
          icon: const Icon(
            Icons.arrow_forward,
            color: AppColors.white,
            size: 20,
          ),
          onPressed: () => Navigator.of(context).maybePop(),
          tooltip: 'חזור',
        ),
      ),
    );
  }
}
