import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/bookmark_folder.dart';

/// Result of the move-to-folder bottom sheet.
///
/// [folderId] is the target folder ID, or null to remove from folder.
/// [createNew] is true if the user wants to create a new folder.
class MoveToFolderResult {
  final String? folderId;
  final bool createNew;

  const MoveToFolderResult({this.folderId, this.createNew = false});

  /// Factory for the "remove from folder" action.
  const MoveToFolderResult.removeFromFolder()
      : folderId = null,
        createNew = false;

  /// Factory for the "create new folder" action.
  const MoveToFolderResult.createNewFolder()
      : folderId = null,
        createNew = true;
}

/// Bottom sheet that lists all folders for moving a favorite into.
///
/// Displays:
/// - "Remove from folder" option at the top
/// - List of existing folders with colored indicators
/// - "Create new folder" option at the bottom
class MoveToFolderSheet extends StatelessWidget {
  final List<BookmarkFolder> folders;
  final String? currentFolderId;

  const MoveToFolderSheet({
    super.key,
    required this.folders,
    this.currentFolderId,
  });

  /// Shows the bottom sheet and returns the result.
  static Future<MoveToFolderResult?> show(
    BuildContext context, {
    required List<BookmarkFolder> folders,
    String? currentFolderId,
  }) {
    return showModalBottomSheet<MoveToFolderResult>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => MoveToFolderSheet(
        folders: folders,
        currentFolderId: currentFolderId,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Title
              Padding(
                padding: const EdgeInsetsDirectional.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Text(
                  'move_to_folder'.tr(),
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),

              const Divider(height: 1, color: AppColors.border),

              // "Remove from folder" option (only if currently in a folder)
              if (currentFolderId != null) ...[
                ListTile(
                  leading: const Icon(
                    Icons.folder_off_outlined,
                    color: AppColors.textSecondary,
                  ),
                  title: Text(
                    'remove_from_folder'.tr(),
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                    ),
                  ),
                  onTap: () => Navigator.of(context).pop(
                    const MoveToFolderResult.removeFromFolder(),
                  ),
                ),
                const Divider(
                  height: 1,
                  color: AppColors.border,
                  indent: 16,
                  endIndent: 16,
                ),
              ],

              // Folder list
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.4,
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: folders.length,
                  separatorBuilder: (_, __) => const Divider(
                    height: 1,
                    color: AppColors.border,
                    indent: 56,
                  ),
                  itemBuilder: (context, index) {
                    final folder = folders[index];
                    final isCurrent = folder.id == currentFolderId;
                    return ListTile(
                      leading: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: _parseFolderColor(folder.color),
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.folder_outlined,
                            color: AppColors.white,
                            size: 18,
                          ),
                        ),
                      ),
                      title: Text(
                        folder.name,
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight:
                              isCurrent ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                      trailing: isCurrent
                          ? const Icon(
                              Icons.check,
                              color: AppColors.likudBlue,
                              size: 20,
                            )
                          : null,
                      onTap: isCurrent
                          ? null
                          : () => Navigator.of(context).pop(
                                MoveToFolderResult(folderId: folder.id),
                              ),
                    );
                  },
                ),
              ),

              const Divider(height: 1, color: AppColors.border),

              // "Create new folder" option
              ListTile(
                leading: const Icon(
                  Icons.create_new_folder_outlined,
                  color: AppColors.likudBlue,
                ),
                title: Text(
                  'create_new_folder'.tr(),
                  style: const TextStyle(
                    color: AppColors.likudBlue,
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                onTap: () => Navigator.of(context).pop(
                  const MoveToFolderResult.createNewFolder(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Parses a hex color string, falling back to Likud blue.
  Color _parseFolderColor(String? hex) {
    if (hex == null || hex.isEmpty) return AppColors.likudBlue;
    try {
      final hexCode = hex.replaceFirst('#', '');
      return Color(int.parse('FF$hexCode', radix: 16));
    } catch (_) {
      return AppColors.likudBlue;
    }
  }
}
