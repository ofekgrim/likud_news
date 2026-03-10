import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../home/domain/entities/article.dart';
import '../../domain/entities/bookmark_folder.dart';
import '../../domain/repositories/enhanced_favorites_repository.dart';
import '../bloc/enhanced_favorites_bloc.dart';
import '../widgets/move_to_folder_sheet.dart';

/// Page that displays the favorites within a specific folder.
///
/// Each favorite card shows the article title, hero image, and a note
/// preview. Supports long-press to move to a different folder, and
/// tapping the note icon to edit a note.
class FolderDetailPage extends StatefulWidget {
  final BookmarkFolder folder;

  const FolderDetailPage({
    super.key,
    required this.folder,
  });

  @override
  State<FolderDetailPage> createState() => _FolderDetailPageState();
}

class _FolderDetailPageState extends State<FolderDetailPage> {
  final List<Article> _articles = [];
  bool _isLoading = true;
  bool _hasMore = true;
  int _currentPage = 1;
  String? _errorMessage;

  static const int _pageSize = 20;

  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final repository = context.read<EnhancedFavoritesRepository>();
    final result = await repository.getFolderFavorites(
      folderId: widget.folder.id,
      page: _currentPage,
      limit: _pageSize,
    );

    if (!mounted) return;

    result.fold(
      (failure) {
        setState(() {
          _isLoading = false;
          _errorMessage = failure.message ?? 'error_loading_favorites'.tr();
        });
      },
      (articles) {
        setState(() {
          _isLoading = false;
          _articles.addAll(articles);
          _hasMore = articles.length >= _pageSize;
        });
      },
    );
  }

  Future<void> _loadMore() async {
    if (_isLoading || !_hasMore) return;
    _currentPage++;
    await _loadFavorites();
  }

  Future<void> _refresh() async {
    setState(() {
      _articles.clear();
      _currentPage = 1;
      _hasMore = true;
    });
    await _loadFavorites();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AppColors.surfaceLight,
        appBar: AppBar(
          title: Text(
            widget.folder.name,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
          backgroundColor: AppColors.white,
          elevation: 0,
          scrolledUnderElevation: 1,
          centerTitle: true,
          iconTheme: const IconThemeData(color: AppColors.textPrimary),
        ),
        body: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _articles.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.likudBlue),
      );
    }

    if (_errorMessage != null && _articles.isEmpty) {
      return _buildErrorState();
    }

    if (_articles.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _refresh,
      color: AppColors.likudBlue,
      child: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          if (notification is ScrollEndNotification &&
              notification.metrics.pixels >=
                  notification.metrics.maxScrollExtent - 200) {
            _loadMore();
          }
          return false;
        },
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          itemCount: _articles.length + (_hasMore ? 1 : 0),
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            if (index == _articles.length) {
              return const Padding(
                padding: EdgeInsets.all(16),
                child: Center(
                  child: CircularProgressIndicator(
                    color: AppColors.likudBlue,
                    strokeWidth: 2,
                  ),
                ),
              );
            }
            return _buildArticleCard(_articles[index]);
          },
        ),
      ),
    );
  }

  Widget _buildArticleCard(Article article) {
    return GestureDetector(
      onTap: () => context.push('/article/${article.id}'),
      onLongPress: () => _showMoveOptions(article),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: AppColors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Article image
            if (article.heroImageUrl != null)
              ClipRRect(
                borderRadius: const BorderRadiusDirectional.only(
                  topStart: Radius.circular(12),
                  bottomStart: Radius.circular(12),
                ),
                child: Image.network(
                  article.heroImageUrl!,
                  width: 100,
                  height: 90,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    width: 100,
                    height: 90,
                    color: AppColors.surfaceMedium,
                    child: const Icon(
                      Icons.image_outlined,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ),
              ),

            // Article info
            Expanded(
              child: Padding(
                padding: const EdgeInsetsDirectional.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      article.title,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (article.subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        article.subtitle!,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                          height: 1.3,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Note icon
            Padding(
              padding: const EdgeInsetsDirectional.only(end: 8),
              child: IconButton(
                icon: const Icon(
                  Icons.note_add_outlined,
                  size: 20,
                  color: AppColors.textTertiary,
                ),
                onPressed: () => _showNoteEditor(article),
                constraints: const BoxConstraints(
                  minWidth: 36,
                  minHeight: 36,
                ),
                padding: EdgeInsets.zero,
                tooltip: 'edit_note'.tr(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.bookmark_border_outlined,
              size: 64,
              color: AppColors.textTertiary.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'folder_empty'.tr(),
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'folder_empty_hint'.tr(),
              style: const TextStyle(
                color: AppColors.textTertiary,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 48,
              color: AppColors.breakingRed,
            ),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: _refresh,
              child: Text(
                'retry'.tr(),
                style: const TextStyle(color: AppColors.likudBlue),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showMoveOptions(Article article) async {
    final bloc = context.read<EnhancedFavoritesBloc>();
    final currentState = bloc.state;
    if (currentState is! EnhancedFavoritesLoaded) return;

    final result = await MoveToFolderSheet.show(
      context,
      folders: currentState.folders,
      currentFolderId: widget.folder.id,
    );

    if (result == null || !mounted) return;

    if (result.createNew) {
      // Show create folder dialog, then move
      final createResult = await showDialog<String>(
        context: context,
        builder: (ctx) => Directionality(
          textDirection: TextDirection.rtl,
          child: _QuickCreateFolderDialog(),
        ),
      );
      if (createResult == null || !mounted) return;
      bloc.add(CreateFolderEvent(name: createResult));
      // Note: Moving into the new folder would require waiting for the
      // folder creation response. For simplicity, we create the folder
      // and let the user move the article in a subsequent action.
      return;
    }

    final repository = context.read<EnhancedFavoritesRepository>();
    final moveResult = await repository.moveToFolder(
      articleId: article.id,
      folderId: result.folderId,
    );

    if (!mounted) return;

    moveResult.fold(
      (failure) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              failure.message ?? 'error_moving_article'.tr(),
            ),
            backgroundColor: AppColors.breakingRed,
          ),
        );
      },
      (_) {
        // Remove from the current list since it moved
        setState(() {
          _articles.removeWhere((a) => a.id == article.id);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('article_moved'.tr()),
            backgroundColor: AppColors.success,
          ),
        );
      },
    );
  }

  Future<void> _showNoteEditor(Article article) async {
    final noteController = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: Text('edit_note'.tr()),
          content: TextField(
            controller: noteController,
            textDirection: TextDirection.rtl,
            maxLines: 4,
            autofocus: true,
            decoration: InputDecoration(
              hintText: 'note_hint'.tr(),
              hintStyle: const TextStyle(color: AppColors.textTertiary),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(
                  color: AppColors.likudBlue,
                  width: 2,
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text(
                'cancel'.tr(),
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(ctx).pop(noteController.text);
              },
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.likudBlue,
              ),
              child: Text('save'.tr()),
            ),
          ],
        ),
      ),
    );
    noteController.dispose();

    if (result == null || !mounted) return;

    final repository = context.read<EnhancedFavoritesRepository>();
    final noteResult = await repository.updateNote(
      articleId: article.id,
      note: result,
    );

    if (!mounted) return;

    noteResult.fold(
      (failure) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              failure.message ?? 'error_saving_note'.tr(),
            ),
            backgroundColor: AppColors.breakingRed,
          ),
        );
      },
      (_) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('note_saved'.tr()),
            backgroundColor: AppColors.success,
          ),
        );
      },
    );
  }
}

/// A simple dialog for quickly creating a folder by name.
class _QuickCreateFolderDialog extends StatelessWidget {
  final _controller = TextEditingController();

  _QuickCreateFolderDialog();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('create_folder'.tr()),
      content: TextField(
        controller: _controller,
        textDirection: TextDirection.rtl,
        autofocus: true,
        decoration: InputDecoration(
          hintText: 'folder_name_hint'.tr(),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(
              color: AppColors.likudBlue,
              width: 2,
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(
            'cancel'.tr(),
            style: const TextStyle(color: AppColors.textSecondary),
          ),
        ),
        FilledButton(
          onPressed: () {
            final name = _controller.text.trim();
            if (name.isNotEmpty) {
              Navigator.of(context).pop(name);
            }
          },
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.likudBlue,
          ),
          child: Text('create'.tr()),
        ),
      ],
    );
  }
}
