import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// Result data returned when user successfully creates a folder.
class CreateFolderResult {
  final String name;
  final String? color;

  const CreateFolderResult({required this.name, this.color});
}

/// Dialog that allows the user to create a new bookmark folder.
///
/// Shows a text field for the folder name and a row of colored
/// circles for choosing a folder color. Returns a [CreateFolderResult]
/// on success, or null if the user cancels.
class CreateFolderDialog extends StatefulWidget {
  const CreateFolderDialog({super.key});

  /// Shows the dialog and returns the result.
  static Future<CreateFolderResult?> show(BuildContext context) {
    return showDialog<CreateFolderResult>(
      context: context,
      builder: (_) => const CreateFolderDialog(),
    );
  }

  @override
  State<CreateFolderDialog> createState() => _CreateFolderDialogState();
}

class _CreateFolderDialogState extends State<CreateFolderDialog> {
  final _nameController = TextEditingController();
  String? _selectedColor;

  /// Available folder colors.
  static const List<String> _folderColors = [
    '#0099DB', // Likud blue
    '#DC2626', // Red
    '#16A34A', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#64748B', // Slate
  ];

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: AlertDialog(
        title: Text(
          'create_folder'.tr(),
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Folder name input
            TextField(
              controller: _nameController,
              textDirection: TextDirection.rtl,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'folder_name_hint'.tr(),
                hintStyle: const TextStyle(color: AppColors.textTertiary),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(
                    color: AppColors.likudBlue,
                    width: 2,
                  ),
                ),
                contentPadding: const EdgeInsetsDirectional.symmetric(
                  horizontal: 12,
                  vertical: 12,
                ),
              ),
              style: const TextStyle(color: AppColors.textPrimary),
            ),
            const SizedBox(height: 16),

            // Color picker label
            Text(
              'folder_color'.tr(),
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),

            // Color circles
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _folderColors.map((colorHex) {
                final isSelected = _selectedColor == colorHex;
                final color = _parseColor(colorHex);
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedColor =
                          _selectedColor == colorHex ? null : colorHex;
                    });
                  },
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      border: isSelected
                          ? Border.all(
                              color: AppColors.textPrimary,
                              width: 2.5,
                            )
                          : null,
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: color.withValues(alpha: 0.4),
                                blurRadius: 6,
                                spreadRadius: 1,
                              ),
                            ]
                          : null,
                    ),
                    child: isSelected
                        ? const Icon(
                            Icons.check,
                            color: AppColors.white,
                            size: 18,
                          )
                        : null,
                  ),
                );
              }).toList(),
            ),
          ],
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
            onPressed: _onSubmit,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.likudBlue,
            ),
            child: Text('create'.tr()),
          ),
        ],
      ),
    );
  }

  void _onSubmit() {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    Navigator.of(context).pop(
      CreateFolderResult(name: name, color: _selectedColor),
    );
  }

  /// Parses a hex color string to a [Color].
  Color _parseColor(String hex) {
    final hexCode = hex.replaceFirst('#', '');
    return Color(int.parse('FF$hexCode', radix: 16));
  }
}
