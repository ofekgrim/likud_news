import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../domain/entities/video_article.dart';
import '../../domain/usecases/get_videos.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Video BLoC events.
sealed class VideoEvent extends Equatable {
  const VideoEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers initial loading of video articles.
final class LoadVideos extends VideoEvent {
  const LoadVideos();
}

/// Loads the next page of video articles (infinite scroll).
final class LoadMoreVideos extends VideoEvent {
  const LoadMoreVideos();
}

/// Pull-to-refresh: reloads all data from page 1.
final class RefreshVideos extends VideoEvent {
  const RefreshVideos();
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Video BLoC states.
sealed class VideoState extends Equatable {
  const VideoState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class VideoInitial extends VideoState {
  const VideoInitial();
}

/// Data is being fetched for the first time.
final class VideoLoading extends VideoState {
  const VideoLoading();
}

/// Video articles loaded successfully.
final class VideoLoaded extends VideoState {
  final List<VideoArticle> videos;
  final bool hasMore;
  final int currentPage;

  const VideoLoaded({
    required this.videos,
    this.hasMore = true,
    this.currentPage = 1,
  });

  /// Creates a copy with optional overrides.
  VideoLoaded copyWith({
    List<VideoArticle>? videos,
    bool? hasMore,
    int? currentPage,
  }) {
    return VideoLoaded(
      videos: videos ?? this.videos,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [videos, hasMore, currentPage];
}

/// An error occurred while loading video data.
final class VideoError extends VideoState {
  final String message;

  const VideoError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Video screen.
///
/// Supports initial load, infinite-scroll pagination, and pull-to-refresh.
@injectable
class VideoBloc extends Bloc<VideoEvent, VideoState> {
  final GetVideos _getVideos;

  /// Number of videos per page. When a page returns fewer items,
  /// [VideoLoaded.hasMore] is set to false.
  static const int _pageSize = 20;

  VideoBloc(this._getVideos) : super(const VideoInitial()) {
    on<LoadVideos>(_onLoadVideos);
    on<LoadMoreVideos>(_onLoadMoreVideos);
    on<RefreshVideos>(_onRefreshVideos);
  }

  /// Loads the first page of video articles.
  Future<void> _onLoadVideos(
    LoadVideos event,
    Emitter<VideoState> emit,
  ) async {
    emit(const VideoLoading());

    final result = await _getVideos(const VideoParams(page: 1));

    result.fold(
      (failure) => emit(VideoError(
        message: failure.message ?? 'Failed to load videos',
      )),
      (videos) => emit(VideoLoaded(
        videos: videos,
        hasMore: videos.length >= _pageSize,
        currentPage: 1,
      )),
    );
  }

  /// Loads the next page of videos and appends to the existing list.
  Future<void> _onLoadMoreVideos(
    LoadMoreVideos event,
    Emitter<VideoState> emit,
  ) async {
    final currentState = state;
    if (currentState is! VideoLoaded || !currentState.hasMore) return;

    final nextPage = currentState.currentPage + 1;
    final result = await _getVideos(VideoParams(page: nextPage));

    result.fold(
      (failure) {
        // Silently keep existing data on pagination failure.
        emit(currentState.copyWith(hasMore: false));
      },
      (newVideos) {
        emit(currentState.copyWith(
          videos: [...currentState.videos, ...newVideos],
          currentPage: nextPage,
          hasMore: newVideos.length >= _pageSize,
        ));
      },
    );
  }

  /// Refreshes video data from scratch (pull-to-refresh).
  Future<void> _onRefreshVideos(
    RefreshVideos event,
    Emitter<VideoState> emit,
  ) async {
    final result = await _getVideos(const VideoParams(page: 1));

    result.fold(
      (failure) {
        // On refresh failure, keep existing state if available.
        if (state is VideoLoaded) return;
        emit(VideoError(
          message: failure.message ?? 'Failed to refresh videos',
        ));
      },
      (videos) => emit(VideoLoaded(
        videos: videos,
        hasMore: videos.length >= _pageSize,
        currentPage: 1,
      )),
    );
  }
}
