import 'package:flutter/foundation.dart';
import 'package:talker_flutter/talker_flutter.dart';

/// Centralized app logger built on Talker.
///
/// Provides structured, colored console output with log levels.
/// Access via [AppLogger.instance] or through DI (get_it).
///
/// Log levels:
/// - [debug]    - Development-only info (hidden in release)
/// - [info]     - General app lifecycle events
/// - [warning]  - Recoverable issues, deprecations
/// - [error]    - Failures that need attention
/// - [critical] - Fatal errors, crashes
class AppLogger {
  AppLogger._();

  static final Talker _instance = Talker(
    settings: TalkerSettings(
      useConsoleLogs: true,
      enabled: true,
    ),
    logger: TalkerLogger(
      settings: TalkerLoggerSettings(
        // In release mode, only show warnings and above
        level: kReleaseMode ? LogLevel.warning : LogLevel.debug,
        maxLineWidth: 100,
      ),
    ),
  );

  /// The singleton Talker instance used throughout the app.
  static Talker get instance => _instance;

  // ---- Convenience methods ----

  /// Log debug info (development only).
  static void debug(String message, [Object? exception, StackTrace? stack]) {
    _instance.debug(message, exception, stack);
  }

  /// Log general info (app lifecycle, navigation, etc).
  static void info(String message, [Object? exception, StackTrace? stack]) {
    _instance.info(message, exception, stack);
  }

  /// Log a warning (recoverable issue).
  static void warning(String message, [Object? exception, StackTrace? stack]) {
    _instance.warning(message, exception, stack);
  }

  /// Log an error with optional exception and stack trace.
  static void error(
    String message, [
    Object? exception,
    StackTrace? stack,
  ]) {
    _instance.error(message, exception, stack);
  }

  /// Log a critical/fatal error.
  static void critical(
    String message, [
    Object? exception,
    StackTrace? stack,
  ]) {
    _instance.critical(message, exception, stack);
  }

  /// Log a handled exception (non-fatal).
  static void handle(
    Object exception, [
    StackTrace? stack,
    String? message,
  ]) {
    _instance.handle(exception, stack, message);
  }
}
