import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../bloc/settings_bloc.dart';

/// Settings page with language, theme, font size, and cache options.
///
/// Uses [SettingsBloc] for state management with in-memory defaults.
/// Hebrew title: "הגדרות"
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        title: Text(
          'settings'.tr(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: BlocConsumer<SettingsBloc, SettingsState>(
        listener: (context, state) {
          if (state is SettingsLoaded && state.cacheCleared) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('cache_cleared'.tr()),
                backgroundColor: AppColors.success,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is! SettingsLoaded) {
            return const Center(child: CircularProgressIndicator());
          }

          return ListView(
            padding: const EdgeInsets.symmetric(vertical: 16),
            children: [
              _buildSectionHeader(context, 'language'.tr()),
              _buildLanguageTile(context, state),
              const Divider(height: 1, color: AppColors.border),
              _buildSectionHeader(context, 'theme'.tr()),
              _buildThemeSelector(context, state),
              const Divider(height: 1, color: AppColors.border),
              _buildSectionHeader(context, 'font_size'.tr()),
              _buildFontSizeSelector(context, state),
              const Divider(height: 1, color: AppColors.border),
              _buildClearCacheTile(context),
              const SizedBox(height: 32),
              _buildVersionInfo(context),
            ],
          );
        },
      ),
    );
  }

  /// Section header label.
  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: AppColors.likudBlue,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }

  /// Language toggle: Hebrew (RTL) <-> English (LTR).
  Widget _buildLanguageTile(BuildContext context, SettingsLoaded state) {
    final isHebrew = state.locale.languageCode == 'he';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SegmentedButton<String>(
        segments: [
          ButtonSegment<String>(
            value: 'he',
            label: Text('hebrew'.tr()),
            icon: const Icon(Icons.format_textdirection_r_to_l),
          ),
          ButtonSegment<String>(
            value: 'en',
            label: const Text('English'),
            icon: const Icon(Icons.format_textdirection_l_to_r),
          ),
        ],
        selected: {isHebrew ? 'he' : 'en'},
        onSelectionChanged: (selection) {
          context.read<SettingsBloc>().add(
                ChangeLanguage(Locale(selection.first)),
              );
        },
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppColors.likudBlue;
            }
            return AppColors.surfaceLight;
          }),
          foregroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppColors.white;
            }
            return AppColors.textPrimary;
          }),
        ),
      ),
    );
  }

  /// Theme mode selector: Light / Dark / System.
  Widget _buildThemeSelector(BuildContext context, SettingsLoaded state) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SegmentedButton<ThemeMode>(
        segments: [
          ButtonSegment<ThemeMode>(
            value: ThemeMode.light,
            label: Text('theme_light'.tr()),
            icon: const Icon(Icons.light_mode_outlined),
          ),
          ButtonSegment<ThemeMode>(
            value: ThemeMode.dark,
            label: Text('theme_dark'.tr()),
            icon: const Icon(Icons.dark_mode_outlined),
          ),
          ButtonSegment<ThemeMode>(
            value: ThemeMode.system,
            label: Text('theme_system'.tr()),
            icon: const Icon(Icons.settings_suggest_outlined),
          ),
        ],
        selected: {state.themeMode},
        onSelectionChanged: (selection) {
          context.read<SettingsBloc>().add(
                ChangeTheme(selection.first),
              );
        },
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppColors.likudBlue;
            }
            return AppColors.surfaceLight;
          }),
          foregroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppColors.white;
            }
            return AppColors.textPrimary;
          }),
        ),
      ),
    );
  }

  /// Font size selector: Small / Medium / Large.
  Widget _buildFontSizeSelector(BuildContext context, SettingsLoaded state) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SegmentedButton<FontSizeOption>(
        segments: FontSizeOption.values
            .map(
              (size) => ButtonSegment<FontSizeOption>(
                value: size,
                label: Text(size.labelHe),
              ),
            )
            .toList(),
        selected: {state.fontSize},
        onSelectionChanged: (selection) {
          context.read<SettingsBloc>().add(
                ChangeFontSize(selection.first),
              );
        },
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppColors.likudBlue;
            }
            return AppColors.surfaceLight;
          }),
          foregroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppColors.white;
            }
            return AppColors.textPrimary;
          }),
        ),
      ),
    );
  }

  /// Clear cache tile with confirmation dialog.
  Widget _buildClearCacheTile(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
      leading: const Icon(
        Icons.cleaning_services_outlined,
        color: AppColors.textSecondary,
      ),
      title: Text('clear_cache'.tr()),
      subtitle: Text(
        'clear_cache_subtitle'.tr(),
        style: TextStyle(color: AppColors.textSecondary),
      ),
      trailing: FilledButton(
        onPressed: () => _showClearCacheDialog(context),
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.breakingRed,
        ),
        child: Text('clear'.tr()),
      ),
    );
  }

  /// Shows a confirmation dialog before clearing the cache.
  void _showClearCacheDialog(BuildContext context) {
    showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text('clear_cache'.tr()),
          content: Text('clear_cache_confirm'.tr()),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text('cancel'.tr()),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                context.read<SettingsBloc>().add(const ClearCache());
              },
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.breakingRed,
              ),
              child: Text('clear'.tr()),
            ),
          ],
        );
      },
    );
  }

  /// App version info at the bottom.
  Widget _buildVersionInfo(BuildContext context) {
    return Center(
      child: Column(
        children: [
          Text(
            'app_name'.tr(),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'version'.tr(),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textTertiary,
                ),
          ),
        ],
      ),
    );
  }
}
