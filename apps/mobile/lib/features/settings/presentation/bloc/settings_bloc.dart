import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all settings events.
sealed class SettingsEvent extends Equatable {
  const SettingsEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of current settings (in-memory defaults for now).
class LoadSettings extends SettingsEvent {
  const LoadSettings();
}

/// Changes the application locale.
class ChangeLanguage extends SettingsEvent {
  final Locale locale;

  const ChangeLanguage(this.locale);

  @override
  List<Object?> get props => [locale];
}

/// Changes the application theme mode.
class ChangeTheme extends SettingsEvent {
  final ThemeMode themeMode;

  const ChangeTheme(this.themeMode);

  @override
  List<Object?> get props => [themeMode];
}

/// Changes the application font size.
class ChangeFontSize extends SettingsEvent {
  final FontSizeOption fontSize;

  const ChangeFontSize(this.fontSize);

  @override
  List<Object?> get props => [fontSize];
}

/// Triggers clearing of the application cache.
class ClearCache extends SettingsEvent {
  const ClearCache();
}

// ---------------------------------------------------------------------------
// Font Size Enum
// ---------------------------------------------------------------------------

/// Available font size options.
enum FontSizeOption {
  small,
  medium,
  large;

  String get labelHe {
    return switch (this) {
      FontSizeOption.small => 'קטן',
      FontSizeOption.medium => 'בינוני',
      FontSizeOption.large => 'גדול',
    };
  }
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all settings states.
sealed class SettingsState extends Equatable {
  const SettingsState();

  @override
  List<Object?> get props => [];
}

/// Settings have been loaded with current values.
class SettingsLoaded extends SettingsState {
  final Locale locale;
  final ThemeMode themeMode;
  final FontSizeOption fontSize;
  final bool cacheCleared;

  const SettingsLoaded({
    required this.locale,
    required this.themeMode,
    required this.fontSize,
    this.cacheCleared = false,
  });

  SettingsLoaded copyWith({
    Locale? locale,
    ThemeMode? themeMode,
    FontSizeOption? fontSize,
    bool? cacheCleared,
  }) {
    return SettingsLoaded(
      locale: locale ?? this.locale,
      themeMode: themeMode ?? this.themeMode,
      fontSize: fontSize ?? this.fontSize,
      cacheCleared: cacheCleared ?? this.cacheCleared,
    );
  }

  @override
  List<Object?> get props => [locale, themeMode, fontSize, cacheCleared];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state for the Settings screen.
///
/// Handles language, theme, font size, and cache clearing.
/// Currently uses in-memory defaults (no persistence).
@injectable
class SettingsBloc extends Bloc<SettingsEvent, SettingsState> {
  SettingsBloc()
      : super(const SettingsLoaded(
          locale: Locale('he'),
          themeMode: ThemeMode.system,
          fontSize: FontSizeOption.medium,
        )) {
    on<LoadSettings>(_onLoadSettings);
    on<ChangeLanguage>(_onChangeLanguage);
    on<ChangeTheme>(_onChangeTheme);
    on<ChangeFontSize>(_onChangeFontSize);
    on<ClearCache>(_onClearCache);
  }

  Future<void> _onLoadSettings(
    LoadSettings event,
    Emitter<SettingsState> emit,
  ) async {
    // In-memory defaults — no persistence for now.
    emit(const SettingsLoaded(
      locale: Locale('he'),
      themeMode: ThemeMode.system,
      fontSize: FontSizeOption.medium,
    ));
  }

  Future<void> _onChangeLanguage(
    ChangeLanguage event,
    Emitter<SettingsState> emit,
  ) async {
    final current = state;
    if (current is SettingsLoaded) {
      emit(current.copyWith(locale: event.locale));
    }
  }

  Future<void> _onChangeTheme(
    ChangeTheme event,
    Emitter<SettingsState> emit,
  ) async {
    final current = state;
    if (current is SettingsLoaded) {
      emit(current.copyWith(themeMode: event.themeMode));
    }
  }

  Future<void> _onChangeFontSize(
    ChangeFontSize event,
    Emitter<SettingsState> emit,
  ) async {
    final current = state;
    if (current is SettingsLoaded) {
      emit(current.copyWith(fontSize: event.fontSize));
    }
  }

  Future<void> _onClearCache(
    ClearCache event,
    Emitter<SettingsState> emit,
  ) async {
    final current = state;
    if (current is SettingsLoaded) {
      // TODO: Add actual cache clearing logic when persistence is implemented.
      emit(current.copyWith(cacheCleared: true));
      // Reset the flag after emitting.
      emit(current.copyWith(cacheCleared: false));
    }
  }
}
