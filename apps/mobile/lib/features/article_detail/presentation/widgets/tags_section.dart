import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/tag.dart';

/// Tags display section showing article classification tags as chips.
///
/// Renders a section header followed by a [Wrap] of [ActionChip] items,
/// each prefixed with "#". Tapping a chip calls [onTagTap] with the
/// corresponding [Tag] entity.
class TagsSection extends StatelessWidget {
  /// The list of tags to display.
  final List<Tag> tags;

  /// Called when a tag chip is tapped.
  final ValueChanged<Tag>? onTagTap;

  const TagsSection({
    super.key,
    required this.tags,
    this.onTagTap,
  });

  @override
  Widget build(BuildContext context) {
    if (tags.isEmpty) return const SizedBox.shrink();

    final theme = Theme.of(context);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Section header
            Text(
              'tags'.tr(),
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),

            // Tag chips
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: tags.map((tag) => _buildChip(context, tag)).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChip(BuildContext context, Tag tag) {
    return ActionChip(
      label: Text(
        '#${tag.nameHe}',
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: AppColors.likudBlue,
              fontWeight: FontWeight.w600,
            ),
      ),
      backgroundColor: AppColors.likudLightBlue,
      side: BorderSide.none,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      onPressed: () => onTagTap?.call(tag),
    );
  }
}
