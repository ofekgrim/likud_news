import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/di.dart';
import '../../../../app/router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../article_detail/presentation/bloc/comments_bloc.dart';
import '../bloc/video_bloc.dart';
import '../widgets/video_thumbnail_card.dart';
import 'video_player_page.dart';

/// Video listing page.
///
/// Displays a "וידאו היום" section header followed by a 2-column grid
/// of video thumbnails with duration badges and category tags.
/// Supports pull-to-refresh and infinite scroll pagination.
class VideoPage extends StatefulWidget {
  const VideoPage({super.key});

  @override
  State<VideoPage> createState() => _VideoPageState();
}

class _VideoPageState extends State<VideoPage> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    context.read<VideoBloc>().add(const LoadVideos());
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
      context.read<VideoBloc>().add(const LoadMoreVideos());
    }
  }

  bool get _isNearBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    return currentScroll >= maxScroll - 200;
  }

  Future<void> _onRefresh() async {
    context.read<VideoBloc>().add(const RefreshVideos());
    await context.read<VideoBloc>().stream.firstWhere(
          (state) => state is VideoLoaded || state is VideoError,
        );
  }

  void _navigateToPlayer(BuildContext context, video) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BlocProvider(
          create: (_) => getIt<CommentsBloc>()
            ..add(LoadComments(
              articleId: video.id,
              targetType: 'article',
            )),
          child: VideoPlayerPage(video: video),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => AppRouter.scaffoldKey.currentState?.openDrawer(),
          color: AppColors.textPrimary,
        ),
        title: Text(
          'video'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: BlocBuilder<VideoBloc, VideoState>(
        builder: (context, state) {
          if (state is VideoLoading || state is VideoInitial) {
            return _buildLoadingState();
          }

          if (state is VideoError) {
            return ErrorView(
              message: state.message,
              onRetry: () =>
                  context.read<VideoBloc>().add(const LoadVideos()),
            );
          }

          if (state is VideoLoaded) {
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
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.75,
      ),
      itemCount: 6,
      physics: const NeverScrollableScrollPhysics(),
      itemBuilder: (_, __) => Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ShimmerLoading(height: 100, borderRadius: 12),
            Padding(
              padding: EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerLoading(height: 12, borderRadius: 4),
                  SizedBox(height: 6),
                  ShimmerLoading(width: 80, height: 12, borderRadius: 4),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadedState(BuildContext context, VideoLoaded state) {
    if (state.videos.isEmpty) {
      return Center(
        child: const Text(
          '\u05D0\u05D9\u05DF \u05E1\u05E8\u05D8\u05D5\u05E0\u05D9\u05DD \u05DC\u05D4\u05E6\u05D2\u05D4',
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: AppColors.likudBlue,
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // Section header.
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                '\u05D5\u05D9\u05D3\u05D0\u05D5 \u05D4\u05D9\u05D5\u05DD',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ),
          // Video grid.
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.75,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final video = state.videos[index];
                  return VideoThumbnailCard(
                    video: video,
                    onTap: () => _navigateToPlayer(context, video),
                  );
                },
                childCount: state.videos.length,
              ),
            ),
          ),
          // Loading indicator at the bottom.
          if (state.hasMore)
            const SliverToBoxAdapter(
              child: Padding(
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
              ),
            ),
          // Bottom padding.
          SliverPadding(padding: EdgeInsets.only(bottom: AppRouter.bottomNavClearance(context))),
        ],
      ),
    );
  }
}
