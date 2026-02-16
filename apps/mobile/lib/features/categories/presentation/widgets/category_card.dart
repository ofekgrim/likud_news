import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../home/domain/entities/category.dart';

/// Individual category card with icon, name, and colored accent.
///
/// Displayed in a 2-column grid on the categories page.
/// Tapping the card triggers the [onTap] callback.
class CategoryCard extends StatelessWidget {
  final Category category;
  final VoidCallback? onTap;

  const CategoryCard({
    super.key,
    required this.category,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final accentColor = _parseCategoryColor(category.color);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Color accent bar.
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: accentColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 12),
            // Category icon.
            _buildIcon(accentColor),
            const SizedBox(height: 10),
            // Category name.
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                category.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Builds the category icon — uses a network image if available,
  /// otherwise falls back to a Material icon.
  Widget _buildIcon(Color accentColor) {
    if (category.iconUrl != null && category.iconUrl!.isNotEmpty) {
      return AppCachedImage(
        imageUrl: category.iconUrl!,
        width: 40,
        height: 40,
        fit: BoxFit.contain,
      );
    }

    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: accentColor.withValues(alpha: 0.12),
        shape: BoxShape.circle,
      ),
      child: Icon(
        Icons.folder_outlined,
        color: accentColor,
        size: 24,
      ),
    );
  }

  /// Parses a hex color string (e.g. "#1E3A8A") into a [Color].
  /// Falls back to [AppColors.likudBlue] on invalid input.
  Color _parseCategoryColor(String? colorHex) {
    if (colorHex == null || colorHex.isEmpty) return AppColors.likudBlue;
    try {
      final hex = colorHex.replaceFirst('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return AppColors.likudBlue;
    }
  }
}
