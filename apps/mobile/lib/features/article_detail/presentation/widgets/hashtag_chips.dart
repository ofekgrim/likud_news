import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// Horizontally wrapping list of tappable hashtag chips.
///
/// Displays the article's hashtags as Material chips.
/// Tapping a chip invokes [onHashtagTap] with the tag text.
class HashtagChips extends StatelessWidget {
  final List<String> hashtags;
  final ValueChanged<String>? onHashtagTap;

  const HashtagChips({
    super.key,
    required this.hashtags,
    this.onHashtagTap,
  });

  @override
  Widget build(BuildContext context) {
    if (hashtags.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Wrap(
        spacing: 8,
        runSpacing: 6,
        children: hashtags.map((tag) => _buildChip(context, tag)).toList(),
      ),
    );
  }

  Widget _buildChip(BuildContext context, String tag) {
    return ActionChip(
      label: Text(
        '#$tag',
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
      onPressed: () => onHashtagTap?.call(tag),
    );
  }
}
