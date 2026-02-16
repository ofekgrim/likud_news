import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// Horizontal wrap of suggestion chips showing popular hashtags.
///
/// Tapping a chip triggers the [onChipTap] callback with the hashtag text.
class SearchSuggestionChips extends StatelessWidget {
  final List<String> suggestions;
  final ValueChanged<String>? onChipTap;

  const SearchSuggestionChips({
    super.key,
    required this.suggestions,
    this.onChipTap,
  });

  /// Default popular hashtags to show when no custom suggestions are provided.
  static const List<String> defaultSuggestions = [
    'ביטחון',
    'כלכלה',
    'חינוך',
    'בריאות',
    'כנסת',
    'חקיקה',
    'דיפלומטיה',
    'טכנולוגיה',
  ];

  @override
  Widget build(BuildContext context) {
    final chips = suggestions.isNotEmpty ? suggestions : defaultSuggestions;

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: chips.map((suggestion) {
        return ActionChip(
          label: Text(
            '#$suggestion',
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.likudBlue,
            ),
          ),
          backgroundColor: AppColors.likudLightBlue,
          side: BorderSide.none,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          onPressed: () => onChipTap?.call(suggestion),
        );
      }).toList(),
    );
  }
}
