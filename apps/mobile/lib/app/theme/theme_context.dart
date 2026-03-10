import 'package:flutter/material.dart';
import 'app_colors_extension.dart';

/// Shorthand accessor for theme-aware colors.
///
/// Usage: `context.colors.textPrimary`, `context.colors.cardSurface`, etc.
extension ThemeColors on BuildContext {
  AppColorsExtension get colors =>
      Theme.of(this).extension<AppColorsExtension>()!;
}
