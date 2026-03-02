import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/bookmark_folder.dart';
import '../bloc/enhanced_favorites_bloc.dart';
import '../widgets/create_folder_dialog.dart';
import '../widgets/folder_card.dart';

/// Page that displays the list of bookmark folders.
///
/// Shows an "All Favorites" option at the top followed by
/// user-created folders. Supports creating, editing, and
/// deleting folders.
class FoldersPage extends StatefulWidget {
  const FoldersPage({super.key});

  @override
  State<FoldersPage> createState() => _FoldersPageState();
}

class _FoldersPageState extends State<FoldersPage> {
  @override
  void initState() {
    super.initState();
    context.read<EnhancedFavoritesBloc>().add(const LoadFolders());
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AppColors.surfaceLight,
        appBar: AppBar(
          title: Text(
            'bookmark_folders'.tr(),
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
        body: BlocBuilder<EnhancedFavoritesBloc, EnhancedFavoritesState>(
          builder: (context, state) {
            if (state is EnhancedFavoritesLoading) {
              return const Center(
                child: CircularProgressIndicator(
                  color: AppColors.likudBlue,
                ),
              );
            }

            if (state is EnhancedFavoritesError) {
              return _buildErrorState(state.message);
            }

            if (state is EnhancedFavoritesLoaded) {
              return _buildFolderList(state.folders, state.selectedFolderId);
            }

            return const SizedBox.shrink();
          },
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: _onCreateFolder,
          backgroundColor: AppColors.likudBlue,
          child: const Icon(Icons.add, color: AppColors.white),
        ),
      ),
    );
  }

  Widget _buildFolderList(
    List<BookmarkFolder> folders,
    String? selectedFolderId,
  ) {
    if (folders.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      padding: const EdgeInsets.only(top: 8, bottom: 80),
      // +1 for the "All Favorites" item at the top
      itemCount: folders.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return _buildAllFavoritesItem(selectedFolderId == null);
        }

        final folder = folders[index - 1];
        return Padding(
          padding: const EdgeInsetsDirectional.symmetric(
            horizontal: 12,
            vertical: 3,
          ),
          child: FolderCard(
            folder: folder,
            isSelected: folder.id == selectedFolderId,
            onTap: () => _onFolderTap(folder),
            onEdit: () => _onEditFolder(folder),
            onDelete: () => _onDeleteFolder(folder.id),
          ),
        );
      },
    );
  }

  Widget _buildAllFavoritesItem(bool isSelected) {
    return Padding(
      padding: const EdgeInsetsDirectional.symmetric(
        horizontal: 12,
        vertical: 3,
      ),
      child: Material(
        color: isSelected ? AppColors.likudLightBlue : AppColors.white,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: () {
            context.read<EnhancedFavoritesBloc>().add(
                  const SelectFolder(null),
                );
          },
          child: Padding(
            padding: const EdgeInsetsDirectional.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(
                    color: AppColors.likudBlue,
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.bookmark_outlined,
                      color: AppColors.white,
                      size: 20,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'all_favorites'.tr(),
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w500,
                    ),
                  ),
                ),
                const Icon(
                  Icons.chevron_left,
                  color: AppColors.textTertiary,
                  size: 20,
                ),
              ],
            ),
          ),
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
            // All Favorites card at top
            _buildAllFavoritesItem(true),
            const SizedBox(height: 40),
            Icon(
              Icons.folder_open_outlined,
              size: 64,
              color: AppColors.textTertiary.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'no_folders_yet'.tr(),
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'create_folder_hint'.tr(),
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

  Widget _buildErrorState(String message) {
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
              message,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {
                context
                    .read<EnhancedFavoritesBloc>()
                    .add(const LoadFolders());
              },
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

  Future<void> _onCreateFolder() async {
    final result = await CreateFolderDialog.show(context);
    if (result == null || !mounted) return;

    context.read<EnhancedFavoritesBloc>().add(
          CreateFolderEvent(name: result.name, color: result.color),
        );
  }

  void _onFolderTap(BookmarkFolder folder) {
    context.push('/folders/${folder.id}', extra: folder);
  }

  Future<void> _onEditFolder(BookmarkFolder folder) async {
    final nameController = TextEditingController(text: folder.name);
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: Text('edit_folder'.tr()),
          content: TextField(
            controller: nameController,
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
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text(
                'cancel'.tr(),
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            ),
            FilledButton(
              onPressed: () {
                final name = nameController.text.trim();
                if (name.isNotEmpty) {
                  Navigator.of(ctx).pop(name);
                }
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
    nameController.dispose();

    if (result == null || !mounted) return;

    context.read<EnhancedFavoritesBloc>().add(
          UpdateFolderEvent(id: folder.id, name: result),
        );
  }

  void _onDeleteFolder(String folderId) {
    context.read<EnhancedFavoritesBloc>().add(DeleteFolderEvent(folderId));
  }
}
