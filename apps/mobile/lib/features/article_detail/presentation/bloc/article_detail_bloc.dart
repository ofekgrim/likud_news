import 'package:equatable/equatable.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/services/device_id_service.dart';
import '../../domain/entities/article_detail.dart';
import '../../domain/repositories/article_detail_repository.dart';
import '../../domain/usecases/get_article_detail.dart';
import '../../domain/usecases/record_read.dart';
import '../../domain/usecases/toggle_favorite.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

sealed class ArticleDetailEvent extends Equatable {
  const ArticleDetailEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading the full article content by URL slug.
class LoadArticleDetail extends ArticleDetailEvent {
  final String slug;

  const LoadArticleDetail(this.slug);

  @override
  List<Object?> get props => [slug];
}

/// Toggles the bookmark/favorite status.
class ToggleFavoriteEvent extends ArticleDetailEvent {
  const ToggleFavoriteEvent();
}

/// Triggers the native share sheet for the current article.
class ShareArticle extends ArticleDetailEvent {
  final SharePlatform platform;

  const ShareArticle(this.platform);

  @override
  List<Object?> get props => [platform];
}

/// Changes the font scale for article body text.
class ChangeFontSize extends ArticleDetailEvent {
  final double scale;

  const ChangeFontSize(this.scale);

  @override
  List<Object?> get props => [scale];
}

/// Supported share targets.
enum SharePlatform { whatsapp, telegram, facebook, x, copyLink, system }

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

sealed class ArticleDetailState extends Equatable {
  const ArticleDetailState();

  @override
  List<Object?> get props => [];
}

class ArticleDetailInitial extends ArticleDetailState {
  const ArticleDetailInitial();
}

class ArticleDetailLoading extends ArticleDetailState {
  const ArticleDetailLoading();
}

class ArticleDetailLoaded extends ArticleDetailState {
  final ArticleDetail article;
  final bool isFavorite;
  final double fontScale;

  const ArticleDetailLoaded({
    required this.article,
    required this.isFavorite,
    this.fontScale = 1.0,
  });

  @override
  List<Object?> get props => [article, isFavorite, fontScale];
}

class ArticleDetailError extends ArticleDetailState {
  final String message;

  const ArticleDetailError(this.message);

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

@injectable
class ArticleDetailBloc extends Bloc<ArticleDetailEvent, ArticleDetailState> {
  final GetArticleDetail _getArticleDetail;
  final ToggleFavorite _toggleFavorite;
  final RecordRead _recordRead;
  final DeviceIdService _deviceIdService;
  final ArticleDetailRepository _repository;

  /// Device identifier obtained from [DeviceIdService].
  String get _deviceId => _deviceIdService.deviceId;

  ArticleDetailBloc(
    this._getArticleDetail,
    this._toggleFavorite,
    this._recordRead,
    this._deviceIdService,
    this._repository,
  ) : super(const ArticleDetailInitial()) {
    on<LoadArticleDetail>(_onLoadArticleDetail);
    on<ToggleFavoriteEvent>(_onToggleFavorite);
    on<ShareArticle>(_onShareArticle);
    on<ChangeFontSize>(_onChangeFontSize);
  }

  Future<void> _onLoadArticleDetail(
    LoadArticleDetail event,
    Emitter<ArticleDetailState> emit,
  ) async {
    emit(const ArticleDetailLoading());

    final result = await _getArticleDetail(
      GetArticleDetailParams(slug: event.slug),
    );

    result.fold(
      (failure) => emit(ArticleDetailError(
        failure.message ?? 'Failed to load article',
      )),
      (article) {
        emit(ArticleDetailLoaded(
          article: article,
          isFavorite: article.isFavorite,
        ));

        // Fire-and-forget: record the read event.
        if (_deviceId.isNotEmpty) {
          _recordRead(RecordReadParams(
            deviceId: _deviceId,
            articleId: article.id,
          ));
        }
      },
    );
  }

  Future<void> _onToggleFavorite(
    ToggleFavoriteEvent event,
    Emitter<ArticleDetailState> emit,
  ) async {
    final currentState = state;
    if (currentState is! ArticleDetailLoaded) return;
    if (_deviceId.isEmpty) return;

    // Optimistic update
    emit(ArticleDetailLoaded(
      article: currentState.article,
      isFavorite: !currentState.isFavorite,
      fontScale: currentState.fontScale,
    ));

    final result = await _toggleFavorite(ToggleFavoriteParams(
      deviceId: _deviceId,
      articleId: currentState.article.id,
    ));

    result.fold(
      // Revert on failure
      (_) => emit(ArticleDetailLoaded(
        article: currentState.article,
        isFavorite: currentState.isFavorite,
        fontScale: currentState.fontScale,
      )),
      (isFavorite) => emit(ArticleDetailLoaded(
        article: currentState.article,
        isFavorite: isFavorite,
        fontScale: currentState.fontScale,
      )),
    );
  }

  Future<void> _onShareArticle(
    ShareArticle event,
    Emitter<ArticleDetailState> emit,
  ) async {
    final currentState = state;
    if (currentState is! ArticleDetailLoaded) return;

    final article = currentState.article;
    final articleUrl =
        '${ApiConstants.baseUrl.replaceAll('/api/v1', '')}/article/${article.slug}';
    final shareText = '${article.title}\n$articleUrl';

    switch (event.platform) {
      case SharePlatform.whatsapp:
        final encoded = Uri.encodeComponent(shareText);
        final uri = Uri.parse('https://wa.me/?text=$encoded');
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      case SharePlatform.telegram:
        final encoded = Uri.encodeComponent(shareText);
        final uri = Uri.parse('https://t.me/share/url?url=$encoded');
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      case SharePlatform.facebook:
        final encodedUrl = Uri.encodeComponent(articleUrl);
        final uri = Uri.parse(
          'https://www.facebook.com/sharer/sharer.php?u=$encodedUrl',
        );
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      case SharePlatform.x:
        final encoded = Uri.encodeComponent(shareText);
        final uri = Uri.parse(
          'https://twitter.com/intent/tweet?text=$encoded',
        );
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      case SharePlatform.copyLink:
        await Clipboard.setData(ClipboardData(text: articleUrl));
      case SharePlatform.system:
        await Share.share(shareText);
    }

    // Fire-and-forget: increment share count on the server.
    _repository.incrementShareCount(article.id);
  }

  void _onChangeFontSize(
    ChangeFontSize event,
    Emitter<ArticleDetailState> emit,
  ) {
    final currentState = state;
    if (currentState is! ArticleDetailLoaded) return;
    emit(ArticleDetailLoaded(
      article: currentState.article,
      isFavorite: currentState.isFavorite,
      fontScale: event.scale.clamp(0.8, 1.6),
    ));
  }
}
