import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_colors_extension.dart';
import 'app_typography.dart';

/// Application theme configuration.
class AppTheme {
  AppTheme._();

  static const _pageTransitions = PageTransitionsTheme(
    builders: {
      TargetPlatform.android: PredictiveBackPageTransitionsBuilder(),
      TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
    },
  );

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
        pageTransitionsTheme: _pageTransitions,
        extensions: const [AppColorsExtension.light],
      );

  static ThemeData get darkTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.likudBlue,
          brightness: Brightness.dark,
          primary: AppColors.likudBlue,
          onPrimary: AppColors.white,
          secondary: const Color(0xFF90CAF9),
          surface: const Color(0xFF1E1E1E),
          error: AppColors.breakingRed,
        ),
        fontFamily: AppTypography.fontFamily,
        textTheme: AppTypography.textTheme,
        scaffoldBackgroundColor: const Color(0xFF121212),
        appBarTheme: const AppBarTheme(
          centerTitle: false,
          elevation: 0,
          backgroundColor: Color(0xFF1E1E1E),
          foregroundColor: Color(0xFFE0E0E0),
          surfaceTintColor: Colors.transparent,
        ),
        cardTheme: CardThemeData(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 1,
          color: const Color(0xFF2C2C2C),
          surfaceTintColor: Colors.transparent,
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Color(0xFF1E1E1E),
          selectedItemColor: AppColors.likudBlue,
          unselectedItemColor: Color(0xFF9E9E9E),
          type: BottomNavigationBarType.fixed,
          elevation: 8,
        ),
        dividerTheme: const DividerThemeData(
          color: Color(0xFF424242),
          thickness: 1,
        ),
        chipTheme: ChipThemeData(
          backgroundColor: const Color(0xFF1A3A5C),
          labelStyle: const TextStyle(
            fontFamily: AppTypography.fontFamily,
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Color(0xFF90CAF9),
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        pageTransitionsTheme: _pageTransitions,
        extensions: const [AppColorsExtension.dark],
      );
}
