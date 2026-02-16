import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// Small badge showing formatted video duration.
///
/// Converts total seconds to MM:SS format and displays
/// in a semi-transparent dark pill overlay.
class DurationBadge extends StatelessWidget {
  final int durationSeconds;

  const DurationBadge({
    super.key,
    required this.durationSeconds,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.black.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _formatDuration(durationSeconds),
        style: const TextStyle(
          fontFamily: 'Heebo',
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppColors.white,
        ),
      ),
    );
  }

  /// Converts seconds to MM:SS format.
  String _formatDuration(int totalSeconds) {
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}
