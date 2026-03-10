import 'dart:ui' show ImageFilter;

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/di.dart';
import '../../../../app/router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../../features/categories/presentation/widgets/category_card.dart';
import '../../../../features/community_polls/presentation/bloc/polls_bloc.dart';
import '../../../../features/feed/presentation/bloc/feed_bloc.dart';
import '../../../../features/feed/presentation/bloc/feed_event.dart'
    as feed_events;
import '../../../../features/feed/presentation/bloc/feed_state.dart';
import '../../../../features/feed/presentation/widgets/feed_item_card.dart';
import '../../../feed/domain/entities/feed_item.dart';
import '../bloc/home_bloc.dart';
import '../widgets/breaking_ticker.dart';
import '../widgets/hero_card.dart';
import '../widgets/story_circles.dart';
import '../widgets/story_viewer.dart';
import '../widgets/trending_breaking_tabs.dart';

/// Main home screen with unified mixed-content feed
class HomePageWithFeed extends StatefulWidget {
  const HomePageWithFeed({super.key});

  @override
  State<HomePageWithFeed> createState() => _HomePageWithFeedState();
}

class _HomePageWithFeedState extends State<HomePageWithFeed> {
  final _scrollController = ScrollController();
  late final FeedBloc _feedBloc;
  late final PollsBloc _pollsBloc;
  bool _showRefreshButton = false;

  @override
  void initState() {
    super.initState();
    // Initialize HomeBloc for hero/ticker/stories
    context.read<HomeBloc>().add(const LoadHome());
    context.read<HomeBloc>().add(const SubscribeToArticleSse());

    // Initialize FeedBloc for mixed-content feed
    _feedBloc = getIt<FeedBloc>();
    _feedBloc.add(const feed_events.LoadFeed());
    _feedBloc.add(const feed_events.SubscribeToUpdates());

    // Initialize PollsBloc for inline poll voting
    _pollsBloc = getIt<PollsBloc>();
    _pollsBloc.add(const LoadPolls());

    // Setup scroll listener for pagination and refresh button visibility
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _feedBloc.close();
    _pollsBloc.close();
    super.dispose();
  }

  void _onScroll() {
    // Load more when near bottom
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.9) {
      _feedBloc.add(const feed_events.LoadMoreFeed());
    }

    // Show/hide refresh button based on scroll position (show after scrolling 500px)
    final shouldShow = _scrollController.position.pixels > 500;
    if (shouldShow != _showRefreshButton) {
      setState(() {
        _showRefreshButton = shouldShow;
      });
    }
  }

  Future<void> _onRefresh() async {
    HapticFeedback.mediumImpact();
    // Refresh both home content and feed
    context.read<HomeBloc>().add(const RefreshFeed());
    _feedBloc.add(const feed_events.RefreshFeed());

    // Wait for completion with timeout to prevent infinite hanging
    await Future.wait([
      context
          .read<HomeBloc>()
          .stream
          .firstWhere((state) => state is HomeLoaded || state is HomeError)
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              // If timeout, return current state
              return context.read<HomeBloc>().state;
            },
          ),
      _feedBloc.stream
          .firstWhere((state) => state is FeedLoaded || state is FeedError)
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              // If timeout, return current state
              return _feedBloc.state;
            },
          ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _feedBloc,
      child: BlocProvider.value(
        value: _pollsBloc,
        child: RtlScaffold(
          showDrawerIcon: true,
          floatingActionButton: _showRefreshButton
              ? _buildLiquidGlassRefreshButton()
              : null,
          floatingActionButtonLocation:
              FloatingActionButtonLocation.miniCenterTop,
          body: BlocBuilder<HomeBloc, HomeState>(
            builder: (context, homeState) {
              if (homeState is HomeLoading || homeState is HomeInitial) {
                return _buildLoadingState();
              }

              if (homeState is HomeError) {
                return ErrorView(
                  message: homeState.message,
                  onRetry: () {
                    context.read<HomeBloc>().add(const LoadHome());
                    _feedBloc.add(const feed_events.LoadFeed());
                  },
                );
              }

              if (homeState is HomeLoaded) {
                return _buildLoadedState(context, homeState);
              }

              return const SizedBox.shrink();
            },
          ),
        ),
      ),
    );
  }

  Widget _buildLiquidGlassRefreshButton() {
    final colors = context.colors;
    return GestureDetector(
      onTap: () async {
        await _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
        await _onRefresh();
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              color: colors.glassBg,
              border: Border.all(color: colors.glassBorder, width: 0.5),
              boxShadow: [
                BoxShadow(
                  color: AppColors.likudBlue.withValues(alpha: 0.15),
                  blurRadius: 12,
                  spreadRadius: 1,
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.refresh_rounded,
                  size: 18,
                  color: colors.textPrimary,
                ),
                const SizedBox(width: 4),
                Text(
                  'refresh'.tr(),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: colors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(
        children: [
          const ShimmerLoading(height: 36, borderRadius: 0),
          const ShimmerLoading(height: 280, borderRadius: 0),
          const SizedBox(height: 16),
          SizedBox(
            height: 100,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 6,
              separatorBuilder: (_, __) => const SizedBox(width: 16),
              itemBuilder: (_, __) => const Column(
                children: [
                  ShimmerLoading(width: 64, height: 64, borderRadius: 32),
                  SizedBox(height: 6),
                  ShimmerLoading(width: 48, height: 12, borderRadius: 4),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          ...List.generate(
            5,
            (_) => const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: ShimmerLoading(height: 200, borderRadius: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadedState(BuildContext context, HomeLoaded homeState) {
    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: AppColors.likudBlue,
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // Breaking ticker
          if (homeState.tickerItems.isNotEmpty)
            SliverToBoxAdapter(
              child: BreakingTicker(
                items: homeState.tickerItems,
                onItemTap: (item) {
                  if (item.articleId != null && item.articleId!.isNotEmpty) {
                    context.push('/article/${item.articleId}');
                  }
                },
              ),
            ),

          // Hero article
          if (homeState.heroArticle != null)
            SliverToBoxAdapter(
              child: HeroCard(
                article: homeState.heroArticle!,
                onTap: () {
                  context.push(
                    '/article/${homeState.heroArticle!.slug ?? homeState.heroArticle!.id}',
                  );
                },
              ),
            ),

          // Story circles
          if (homeState.stories.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 16),
                child: StoryCircles(
                  stories: homeState.stories,
                  onStoryTap: (story, index) {
                    Navigator.of(context, rootNavigator: true).push(
                      PageRouteBuilder(
                        pageBuilder: (_, __, ___) => StoryViewer(
                          stories: homeState.stories,
                          initialIndex: index,
                        ),
                        transitionsBuilder: (_, animation, __, child) {
                          return FadeTransition(
                            opacity: animation,
                            child: child,
                          );
                        },
                        transitionDuration: const Duration(milliseconds: 200),
                      ),
                    );
                  },
                ),
              ),
            ),

          // Trending / Breaking tabs carousel
          if (homeState.trendingArticles.isNotEmpty ||
              homeState.breakingArticles.isNotEmpty)
            SliverToBoxAdapter(
              child: TrendingBreakingTabs(
                trendingArticles: homeState.trendingArticles,
                breakingArticles: homeState.breakingArticles,
                onArticleTap: (article) {
                  context.push('/article/${article.slug ?? article.id}');
                },
              ),
            ),

          // Date display
          SliverToBoxAdapter(child: _buildDateHeader()),

          // Section header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Text(
                'latest_news'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: context.colors.textPrimary,
                ),
              ),
            ),
          ),

          // MIXED-CONTENT FEED (NEW)
          BlocBuilder<FeedBloc, FeedState>(
            builder: (context, feedState) {
              if (feedState is FeedLoading) {
                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, index) => const Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: ShimmerLoading(height: 200, borderRadius: 12),
                    ),
                    childCount: 3,
                  ),
                );
              }

              if (feedState is FeedError) {
                return SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: ErrorView(
                      message: feedState.message,
                      onRetry: () =>
                          _feedBloc.add(const feed_events.LoadFeed()),
                    ),
                  ),
                );
              }

              if (feedState is FeedLoaded) {
                if (feedState.items.isEmpty) {
                  return SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Center(
                        child: Text(
                          'no_content'.tr(),
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 14,
                            color: context.colors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  );
                }

                return SliverList(
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final feedItem = feedState.items[index];
                    return FeedItemCard(
                      feedItem: feedItem,
                      onTap: () => _handleFeedItemTap(context, feedItem),
                    );
                  }, childCount: feedState.items.length),
                );
              }

              return const SliverToBoxAdapter(child: SizedBox.shrink());
            },
          ),

          // Loading more indicator / end of feed
          BlocBuilder<FeedBloc, FeedState>(
            builder: (context, feedState) {
              if (feedState is FeedLoaded && feedState.isLoadingMore) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(
                      child: CircularProgressIndicator(
                        color: AppColors.likudBlue,
                      ),
                    ),
                  ),
                );
              }
              if (feedState is FeedLoaded &&
                  feedState.hasReachedMax &&
                  feedState.items.isNotEmpty) {
                return SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Text(
                        'end_of_feed'.tr(),
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 13,
                          color: context.colors.textTertiary,
                        ),
                      ),
                    ),
                  ),
                );
              }
              // Show category grid after first feed page loads
              if (feedState is FeedLoaded && feedState.items.isNotEmpty) {
                return _buildCategoryGrid(homeState);
              }
              return const SliverToBoxAdapter(child: SizedBox.shrink());
            },
          ),

          // Bottom padding
          SliverPadding(
            padding: EdgeInsets.only(
              bottom: AppRouter.bottomNavClearance(context),
            ),
          ),
        ],
      ),
    );
  }

  void _handleFeedItemTap(BuildContext context, FeedItem feedItem) {
    switch (feedItem) {
      case ArticleFeedItem item:
        context.push('/article/${item.article.slug}');
        break;
      case PollFeedItem _:
        // Navigate to polls list page (voting happens inline)
        context.push('/polls');
        break;
      case EventFeedItem item:
        // Navigate to event detail page for RSVP
        context.push('/events/${item.event.id}');
        break;
      case ElectionUpdateFeedItem item:
        // Navigate to election day hub (3-tab view)
        context.push('/election-day/${item.electionUpdate.electionId}');
        break;
      case QuizPromptFeedItem item:
        // Navigate to quiz intro page (quizPrompt.id is the electionId)
        context.push('/primaries/quiz/${item.quizPrompt.id}');
        break;
      case DailyQuizFeedItem _:
        // Navigate to daily quiz page
        context.push('/daily-quiz');
        break;
    }
  }

  Widget _buildDateHeader() {
    final now = DateTime.now();
    final gregorianDate = DateFormat('dd/MM/yyyy').format(now);
    final hebrewDay = _hebrewDayName(now.weekday);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(
            Icons.calendar_today_outlined,
            size: 16,
            color: context.colors.textTertiary,
          ),
          const SizedBox(width: 6),
          Text(
            '$hebrewDay, $gregorianDate',
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 13,
              color: context.colors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryGrid(HomeLoaded homeState) {
    if (homeState.categories.isEmpty) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }
    return SliverMainAxisGroup(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 4),
            child: Text(
              'browse_categories'.tr(),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: context.colors.textPrimary,
              ),
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.2,
            ),
            delegate: SliverChildBuilderDelegate((context, index) {
              final category = homeState.categories[index];
              return CategoryCard(
                category: category,
                onTap: () {
                  context.push(
                    '/category/${category.slug}?name=${Uri.encodeComponent(category.name)}',
                  );
                },
              );
            }, childCount: homeState.categories.length),
          ),
        ),
      ],
    );
  }

  String _hebrewDayName(int weekday) {
    final days = {
      DateTime.sunday: 'day_sunday'.tr(),
      DateTime.monday: 'day_monday'.tr(),
      DateTime.tuesday: 'day_tuesday'.tr(),
      DateTime.wednesday: 'day_wednesday'.tr(),
      DateTime.thursday: 'day_thursday'.tr(),
      DateTime.friday: 'day_friday'.tr(),
      DateTime.saturday: 'day_saturday'.tr(),
    };
    return days[weekday] ?? '';
  }
}
