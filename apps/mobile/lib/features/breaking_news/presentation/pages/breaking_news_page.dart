import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

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

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    context.read<BreakingNewsBloc>().add(const LoadBreakingNews());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceLight,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildTabBar(),
            Expanded(child: _buildBody()),
          ],
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
          BlocSelector<BreakingNewsBloc, BreakingNewsState, bool>(
            selector: (state) =>
                state is BreakingNewsLoaded && state.isLive,
            builder: (context, isLive) {
              return LiveIndicator(isLive: isLive);
            },
          ),
          const SizedBox(width: 10),
          Text(
            'דסק החדשות',
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
            tooltip: 'רענון',
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
        tabs: const [
          Tab(text: 'מבזקים'),
          Tab(text: 'לכל הכתבות'),
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
        _BreakingList(breakingOnly: true),
        // Tab 2 - All articles
        _BreakingList(breakingOnly: false),
      ],
    );
  }
}

/// Internal list widget driven by [BreakingNewsBloc].
///
/// When [breakingOnly] is true, filters to only articles where
/// [Article.isBreaking] is true. Otherwise shows all articles.
class _BreakingList extends StatelessWidget {
  final bool breakingOnly;

  const _BreakingList({required this.breakingOnly});

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
              final filtered = breakingOnly
                  ? articles.where((a) => a.isBreaking).toList()
                  : articles;

              if (filtered.isEmpty) {
                return const EmptyView(
                  message: 'אין מבזקים כרגע',
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
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                  physics: const AlwaysScrollableScrollPhysics(),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    return BreakingNewsCard(
                      article: filtered[index],
                      onTap: () {
                        // Navigate to article detail — wired by the consumer.
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
