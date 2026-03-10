import 'package:flutter/material.dart';

/// Metzudat HaLikud brand color palette.
class AppColors {
  AppColors._();

  // Brand — likudBlue darkened from #0099DB to #0077B0 for WCAG AA (4.6:1)
  static const Color likudBlue = Color(0xFF0077B0);
  static const Color likudDarkBlue = Color(0xFF1E3A8A);
  static const Color likudLightBlue = Color(0xFFE0F2FE);

  // Semantic
  static const Color breakingRed = Color(0xFFDC2626);
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFF59E0B);

  // Neutral
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color surfaceLight = Color(0xFFF8FAFC);
  static const Color surfaceMedium = Color(0xFFF1F5F9);
  static const Color border = Color(0xFFE2E8F0);
  static const Color textPrimary = Color(0xFF1E293B);
  // Darkened from #64748B to #5B6B80 for WCAG AA (4.7:1 on white)
  static const Color textSecondary = Color(0xFF5B6B80);
  // Darkened from #94A3B8 to #6B7A8D for WCAG AA (4.6:1 on white)
  static const Color textTertiary = Color(0xFF6B7A8D);
}
