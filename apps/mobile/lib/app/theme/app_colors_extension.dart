import 'package:flutter/material.dart';

/// Theme-aware color extension for dark mode support.
///
/// Access via `context.colors.xxx` (import theme_context.dart).
/// Brand colors (likudBlue, breakingRed, etc.) stay in [AppColors].
class AppColorsExtension extends ThemeExtension<AppColorsExtension> {
  final Color surface;
  final Color surfaceVariant;
  final Color surfaceMedium;
  final Color background;
  final Color textPrimary;
  final Color textSecondary;
  final Color textTertiary;
  final Color border;
  final Color shadow;
  final Color cardSurface;
  final Color likudAccentBg;
  final Color glassBg;
  final Color glassBorder;

  const AppColorsExtension({
    required this.surface,
    required this.surfaceVariant,
    required this.surfaceMedium,
    required this.background,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.border,
    required this.shadow,
    required this.cardSurface,
    required this.likudAccentBg,
    required this.glassBg,
    required this.glassBorder,
  });

  static const light = AppColorsExtension(
    surface: Color(0xFFFFFFFF),
    surfaceVariant: Color(0xFFF8FAFC),
    surfaceMedium: Color(0xFFF1F5F9),
    background: Color(0xFFFFFFFF),
    textPrimary: Color(0xFF1E293B),
    textSecondary: Color(0xFF5B6B80),
    textTertiary: Color(0xFF6B7A8D),
    border: Color(0xFFE2E8F0),
    shadow: Color(0x14000000), // black/0.08
    cardSurface: Color(0xFFFFFFFF),
    likudAccentBg: Color(0xFFE0F2FE),
    glassBg: Color(0xFFFFFFFF),
    glassBorder: Color(0x4DFFFFFF), // white/0.3
  );

  static const dark = AppColorsExtension(
    surface: Color(0xFF1E1E1E),
    surfaceVariant: Color(0xFF252525),
    surfaceMedium: Color(0xFF2C2C2C),
    background: Color(0xFF121212),
    textPrimary: Color(0xFFE8E8E8),
    textSecondary: Color(0xFFB0B0B0),
    textTertiary: Color(0xFF808080),
    border: Color(0xFF3A3A3A),
    shadow: Color(0x4D000000), // black/0.3
    cardSurface: Color(0xFF1E1E1E),
    likudAccentBg: Color(0xFF1A3A5C),
    glassBg: Color(0xFF1E1E1E),
    glassBorder: Color(0x14FFFFFF), // white/0.08
  );

  @override
  ThemeExtension<AppColorsExtension> copyWith({
    Color? surface,
    Color? surfaceVariant,
    Color? surfaceMedium,
    Color? background,
    Color? textPrimary,
    Color? textSecondary,
    Color? textTertiary,
    Color? border,
    Color? shadow,
    Color? cardSurface,
    Color? likudAccentBg,
    Color? glassBg,
    Color? glassBorder,
  }) {
    return AppColorsExtension(
      surface: surface ?? this.surface,
      surfaceVariant: surfaceVariant ?? this.surfaceVariant,
      surfaceMedium: surfaceMedium ?? this.surfaceMedium,
      background: background ?? this.background,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      border: border ?? this.border,
      shadow: shadow ?? this.shadow,
      cardSurface: cardSurface ?? this.cardSurface,
      likudAccentBg: likudAccentBg ?? this.likudAccentBg,
      glassBg: glassBg ?? this.glassBg,
      glassBorder: glassBorder ?? this.glassBorder,
    );
  }

  @override
  ThemeExtension<AppColorsExtension> lerp(
    covariant ThemeExtension<AppColorsExtension>? other,
    double t,
  ) {
    if (other is! AppColorsExtension) return this;
    return AppColorsExtension(
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceVariant: Color.lerp(surfaceVariant, other.surfaceVariant, t)!,
      surfaceMedium: Color.lerp(surfaceMedium, other.surfaceMedium, t)!,
      background: Color.lerp(background, other.background, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textTertiary: Color.lerp(textTertiary, other.textTertiary, t)!,
      border: Color.lerp(border, other.border, t)!,
      shadow: Color.lerp(shadow, other.shadow, t)!,
      cardSurface: Color.lerp(cardSurface, other.cardSurface, t)!,
      likudAccentBg: Color.lerp(likudAccentBg, other.likudAccentBg, t)!,
      glassBg: Color.lerp(glassBg, other.glassBg, t)!,
      glassBorder: Color.lerp(glassBorder, other.glassBorder, t)!,
    );
  }
}
