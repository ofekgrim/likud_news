import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_typography.dart';

/// Application theme configuration.
class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.likudBlue,
          brightness: Brightness.light,
          primary: AppColors.likudBlue,
          onPrimary: AppColors.white,
          secondary: AppColors.likudDarkBlue,
          surface: AppColors.white,
          error: AppColors.breakingRed,
        ),
        fontFamily: AppTypography.fontFamily,
        textTheme: AppTypography.textTheme,
        scaffoldBackgroundColor: AppColors.white,
        appBarTheme: const AppBarTheme(
          centerTitle: false,
          elevation: 0,
          backgroundColor: AppColors.white,
          foregroundColor: AppColors.textPrimary,
          surfaceTintColor: Colors.transparent,
        ),
        cardTheme: CardThemeData(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 1,
          color: AppColors.white,
          surfaceTintColor: Colors.transparent,
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: AppColors.white,
          selectedItemColor: AppColors.likudBlue,
          unselectedItemColor: AppColors.textTertiary,
          type: BottomNavigationBarType.fixed,
          elevation: 8,
        ),
        dividerTheme: const DividerThemeData(
          color: AppColors.border,
          thickness: 1,
        ),
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.likudLightBlue,
          labelStyle: const TextStyle(
            fontFamily: AppTypography.fontFamily,
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: AppColors.likudBlue,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      );

  static ThemeData get darkTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.likudBlue,
          brightness: Brightness.dark,
          primary: AppColors.likudBlue,
          error: AppColors.breakingRed,
        ),
        fontFamily: AppTypography.fontFamily,
        textTheme: AppTypography.textTheme,
      );
}
