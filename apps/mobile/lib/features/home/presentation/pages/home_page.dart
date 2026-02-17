import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../bloc/home_bloc.dart';
import '../widgets/breaking_ticker.dart';
import '../widgets/feed_article_card.dart';
import '../widgets/hero_card.dart';
import '../widgets/story_circles.dart';

/// Main home screen of the Metzudat HaLikud news app.
///
/// Composed of:
/// 1. Breaking ticker (marquee red bar)
/// 2. Hero article (full-width image with gradient overlay)
/// 3. Story circles (horizontal category shortcuts)
/// 4. Date display (Hebrew + Gregorian)
/// 5. News feed cards (infinite scroll with pull-to-refresh)
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    context.read<HomeBloc>().add(const LoadHome());
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
      context.read<HomeBloc>().add(const LoadMoreArticles());
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
    context.read<HomeBloc>().add(const RefreshFeed());
    // Wait for the state to change from the current loaded state.
    await context.read<HomeBloc>().stream.firstWhere(
          (state) => state is HomeLoaded || state is HomeError,
        );
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      body: BlocBuilder<HomeBloc, HomeState>(
        builder: (context, state) {
          if (state is HomeLoading || state is HomeInitial) {
            return _buildLoadingState();
          }

          if (state is HomeError) {
            return ErrorView(
              message: state.message,
              onRetry: () =>
                  context.read<HomeBloc>().add(const LoadHome()),
            );
          }

          if (state is HomeLoaded) {
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
          // Ticker shimmer.
          const ShimmerLoading(height: 36, borderRadius: 0),
          // Hero shimmer.
          const ShimmerLoading(height: 280, borderRadius: 0),
          const SizedBox(height: 16),
          // Story circles shimmer.
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
                        ShimmerLoading(
                          height: 14,
                          borderRadius: 4,
                        ),
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

  Widget _buildLoadedState(BuildContext context, HomeLoaded state) {
    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: AppColors.likudBlue,
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // Breaking ticker.
          if (state.tickerItems.isNotEmpty)
            SliverToBoxAdapter(
              child: BreakingTicker(
                items: state.tickerItems,
                onItemTap: (item) {
                  if (item.articleId != null && item.articleId!.isNotEmpty) {
                    context.push('/article/${item.articleId}');
                  }
                  // External linkUrl handling can be added with url_launcher.
                },
              ),
            ),

          // Hero article.
          if (state.heroArticle != null)
            SliverToBoxAdapter(
              child: HeroCard(
                article: state.heroArticle!,
                onTap: () {
                  context.push('/article/${state.heroArticle!.slug ?? state.heroArticle!.id}');
                },
              ),
            ),

          // Story circles.
          if (state.categories.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 16),
                child: StoryCircles(
                  categories: state.categories,
                  onCategoryTap: (category) {
                    context.push('/category/${category.slug ?? category.id}');
                  },
                ),
              ),
            ),

          // Date display.
          SliverToBoxAdapter(
            child: _buildDateHeader(),
          ),

          // Section header.
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

          // Feed articles.
          if (state.articles.isEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Center(
                  child: Text(
                    'no_articles'.tr(),
                    style: const TextStyle(
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

  /// Builds the Hebrew + Gregorian date header.
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

  /// Returns the Hebrew name for the day of the week.
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
