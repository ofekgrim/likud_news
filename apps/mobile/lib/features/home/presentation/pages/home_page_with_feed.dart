import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/di.dart';
import '../../../../app/router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../../features/categories/presentation/widgets/category_card.dart';
import '../../../../features/feed/presentation/bloc/feed_bloc.dart';
import '../../../../features/feed/presentation/bloc/feed_event.dart' as feed_events;
import '../../../../features/feed/presentation/bloc/feed_state.dart';
import '../../../../features/feed/presentation/widgets/feed_item_card.dart';
import '../../../feed/domain/entities/feed_item.dart';
import '../bloc/home_bloc.dart';
import '../widgets/breaking_ticker.dart';
import '../widgets/hero_card.dart';
import '../widgets/story_circles.dart';
import '../widgets/story_viewer.dart';

/// Main home screen with unified mixed-content feed
class HomePageWithFeed extends StatefulWidget {
  const HomePageWithFeed({super.key});

  @override
  State<HomePageWithFeed> createState() => _HomePageWithFeedState();
}

class _HomePageWithFeedState extends State<HomePageWithFeed> {
  final _scrollController = ScrollController();
  late final FeedBloc _feedBloc;

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

    // Setup scroll listener for pagination
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _feedBloc.close();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.9) {
      _feedBloc.add(const feed_events.LoadMoreFeed());
    }
  }

  Future<void> _onRefresh() async {
    // Refresh both home content and feed
    context.read<HomeBloc>().add(const RefreshFeed());
    _feedBloc.add(const feed_events.RefreshFeed());

    await Future.wait([
      context.read<HomeBloc>().stream.firstWhere(
            (state) => state is HomeLoaded || state is HomeError,
          ),
      _feedBloc.stream.firstWhere(
            (state) => state is FeedLoaded || state is FeedError,
          ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _feedBloc,
      child: RtlScaffold(
        showDrawerIcon: true,
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
                  context.push('/article/${homeState.heroArticle!.slug ?? homeState.heroArticle!.id}');
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
                          return FadeTransition(opacity: animation, child: child);
                        },
                        transitionDuration: const Duration(milliseconds: 200),
                      ),
                    );
                  },
                ),
              ),
            ),

          // Date display
          SliverToBoxAdapter(
            child: _buildDateHeader(),
          ),

          // Section header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Text(
                'latest_news'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
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
                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                      onRetry: () => _feedBloc.add(const feed_events.LoadFeed()),
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
                          style: const TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 14,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  );
                }

                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final feedItem = feedState.items[index];
                      return FeedItemCard(
                        feedItem: feedItem,
                        onTap: () => _handleFeedItemTap(context, feedItem),
                      );
                    },
                    childCount: feedState.items.length,
                  ),
                );
              }

              return const SliverToBoxAdapter(child: SizedBox.shrink());
            },
          ),

          // Loading more indicator
          BlocBuilder<FeedBloc, FeedState>(
            builder: (context, feedState) {
              if (feedState is FeedLoaded && feedState.isLoadingMore) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                );
              }
              return const SliverToBoxAdapter(child: SizedBox.shrink());
            },
          ),

          // Browse categories section
          if (homeState.categories.isNotEmpty) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 4),
                child: Text(
                  'browse_categories'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
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
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final category = homeState.categories[index];
                    return CategoryCard(
                      category: category,
                      onTap: () {
                        context.push('/category/${category.slug}?name=${Uri.encodeComponent(category.name)}');
                      },
                    );
                  },
                  childCount: homeState.categories.length,
                ),
              ),
            ),
          ],

          // Bottom padding
          SliverPadding(
            padding: EdgeInsets.only(bottom: AppRouter.bottomNavClearance(context)),
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
      case PollFeedItem item:
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
          const Icon(
            Icons.calendar_today_outlined,
            size: 16,
            color: AppColors.textTertiary,
          ),
          const SizedBox(width: 6),
          Text(
            '$hebrewDay, $gregorianDate',
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 13,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
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
