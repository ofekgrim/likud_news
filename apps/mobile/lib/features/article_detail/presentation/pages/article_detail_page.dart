import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../bloc/article_detail_bloc.dart';
import '../bloc/comments_bloc.dart';
import '../widgets/alert_banner_widget.dart';
import '../widgets/article_actions_bar.dart';
import '../widgets/article_header.dart';
import '../widgets/block_renderer.dart';
import '../widgets/category_articles_carousel.dart';
import '../widgets/comments_section.dart';
import '../widgets/recommended_articles.dart' show AllArticlesCarousel;
import '../widgets/related_articles.dart';
import '../widgets/reporter_row.dart';
import '../widgets/tags_section.dart';

/// Full-screen article detail page.
///
/// Expects an [ArticleDetailBloc] and [CommentsBloc] to be provided above
/// this widget. Loads the article by slug and displays the hero header,
/// alert banner, reporter row, structured body blocks, tags, comments,
/// related articles, same-category carousel, and the share/bookmark action bar.
///
/// Shows a scroll progress indicator at the top of the screen.
class ArticleDetailPage extends StatefulWidget {
  final String slug;

  const ArticleDetailPage({super.key, required this.slug});

  @override
  State<ArticleDetailPage> createState() => _ArticleDetailPageState();
}

class _ArticleDetailPageState extends State<ArticleDetailPage> {
  final ScrollController _scrollController = ScrollController();
  double _scrollProgress = 0.0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final maxScroll = _scrollController.position.maxScrollExtent;
    if (maxScroll <= 0) return;
    final currentScroll = _scrollController.offset;
    setState(() {
      _scrollProgress = (currentScroll / maxScroll).clamp(0.0, 1.0);
    });
  }

  void _showFontSizeDialog(BuildContext context, double currentScale) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) {
        double tempScale = currentScale;
        return StatefulBuilder(
          builder: (builderContext, setSheetState) {
            return Directionality(
              textDirection: TextDirection.rtl,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 20,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'font_size_title'.tr(),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Text(
                          'A',
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 14,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        Expanded(
                          child: Slider(
                            value: tempScale,
                            min: 0.8,
                            max: 1.6,
                            divisions: 8,
                            activeColor: AppColors.likudBlue,
                            label: '${(tempScale * 100).round()}%',
                            onChanged: (value) {
                              setSheetState(() {
                                tempScale = value;
                              });
                              context.read<ArticleDetailBloc>().add(
                                ChangeFontSize(value),
                              );
                            },
                          ),
                        ),
                        Text(
                          'A',
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Dispatch load event when the page builds for the first time.
    // The BLoC will de-duplicate if already loading.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final bloc = context.read<ArticleDetailBloc>();
      if (bloc.state is ArticleDetailInitial) {
        bloc.add(LoadArticleDetail(widget.slug));
      }
    });

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: BlocConsumer<ArticleDetailBloc, ArticleDetailState>(
          listener: (context, state) {
            // When article loads successfully, dispatch LoadComments.
            if (state is ArticleDetailLoaded) {
              context.read<CommentsBloc>().add(
                LoadComments(
                  articleId: state.article.id,
                  targetType: 'article',
                ),
              );
            }
          },
          builder: (context, state) {
            return switch (state) {
              ArticleDetailInitial() || ArticleDetailLoading() => const Center(
                child: CircularProgressIndicator(color: AppColors.likudBlue),
              ),
              ArticleDetailError(:final message) => ErrorView(
                message: message,
                onRetry: () => context.read<ArticleDetailBloc>().add(
                  LoadArticleDetail(widget.slug),
                ),
              ),
              ArticleDetailLoaded(
                :final article,
                :final isFavorite,
                :final fontScale,
              ) =>
                Stack(
                  children: [
                    // Main content
                    Column(
                      children: [
                        Expanded(
                          child: CustomScrollView(
                            controller: _scrollController,
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
                                    // 1. Alert banner (if enabled)
                                    AlertBannerWidget(
                                      text: article.alertBannerText ?? '',
                                      colorHex: article.alertBannerColor,
                                      enabled: article.alertBannerEnabled,
                                    ),

                                    // 2. Hero image caption
                                    if (article.heroImageCaption != null &&
                                        article.heroImageCaption!.isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.fromLTRB(
                                          16,
                                          12,
                                          16,
                                          0,
                                        ),
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

                                    // 3. Reporter row
                                    ReporterRow(
                                      author: article.authorEntity,
                                      publishedAt: article.publishedAt,
                                      readingTimeMinutes:
                                          article.readingTimeMinutes,
                                      isFavorite: isFavorite,
                                      onShare: () =>
                                          context.read<ArticleDetailBloc>().add(
                                            ShareArticle(SharePlatform.system),
                                          ),
                                      onBookmark: () => context
                                          .read<ArticleDetailBloc>()
                                          .add(const ToggleFavoriteEvent()),
                                      onFontSize: () => _showFontSizeDialog(
                                        context,
                                        fontScale,
                                      ),
                                      onAuthorTap: article.authorEntity != null
                                          ? () => context.push(
                                              '/author/${article.authorEntity!.id}',
                                            )
                                          : null,
                                    ),

                                    // 4. Block renderer (body content)
                                    BlockRenderer(
                                      blocks: article.bodyBlocks,
                                      fontScale: fontScale,
                                      htmlFallback: article.content,
                                    ),

                                    const SizedBox(height: 24),

                                    // 5. Tags section
                                    TagsSection(
                                      tags: article.tags,
                                      onTagTap: (tag) => context.push(
                                        '/tag/${tag.slug}?name=${Uri.encodeComponent(tag.nameHe)}',
                                      ),
                                    ),

                                    // 6. Related articles (by tags)
                                    if (article.relatedArticles.isNotEmpty) ...[
                                      const SizedBox(height: 24),
                                      const Divider(
                                        height: 1,
                                        indent: 16,
                                        endIndent: 16,
                                        color: AppColors.border,
                                      ),
                                      const SizedBox(height: 20),
                                      RelatedArticles(
                                        articles: article.relatedArticles,
                                        onArticleTap: (related) {
                                          if (related.slug != null) {
                                            context.push(
                                              '/article/${related.slug!}',
                                            );
                                          }
                                        },
                                      ),
                                    ],

                                    const SizedBox(height: 24),

                                    // 8. Comments section
                                    if (article.allowComments)
                                      CommentsSection(
                                        targetId: article.id,
                                        targetType: 'article',
                                        commentCount: article.commentCount,
                                        allowComments: article.allowComments,
                                      ),

                                    const SizedBox(height: 24),

                                    // 9. Same category articles carousel
                                    if (article.sameCategoryArticles.isNotEmpty)
                                      CategoryArticlesCarousel(
                                        articles: article.sameCategoryArticles,
                                        categoryName: article.categoryName,
                                        onArticleTap: (a) {
                                          if (a.slug != null) {
                                            context.push('/article/${a.slug!}');
                                          }
                                        },
                                      ),

                                    const SizedBox(height: 24),

                                    // 10. All articles carousel
                                    if (article.latestArticles.isNotEmpty)
                                      AllArticlesCarousel(
                                        articles: article.latestArticles,
                                        onArticleTap: (a) {
                                          if (a.slug != null) {
                                            context.push('/article/${a.slug!}');
                                          }
                                        },
                                      ),

                                    const SizedBox(height: 40),
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

                    // Scroll progress indicator
                    Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      child: SafeArea(
                        bottom: false,
                        child: LinearProgressIndicator(
                          value: _scrollProgress,
                          minHeight: 3,
                          color: AppColors.likudBlue,
                          backgroundColor: Colors.transparent,
                        ),
                      ),
                    ),
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
          onPressed: () => context.pop(),
          tooltip: '\u05D7\u05D6\u05D5\u05E8', // חזור
        ),
      ),
    );
  }
}
