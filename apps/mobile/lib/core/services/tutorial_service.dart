import 'package:hive/hive.dart';
import 'package:injectable/injectable.dart';

/// Service for tracking whether the user has seen tutorial overlays.
/// Uses Hive for persistent local storage.
@lazySingleton
class TutorialService {
  static const String _boxName = 'tutorial_box';

  /// Check if the user has already seen a tutorial.
  bool hasSeenTutorial(String key) {
    final box = Hive.box(_boxName);
    return box.get(key, defaultValue: false) as bool;
  }

  /// Mark a tutorial as seen.
  Future<void> markAsSeen(String key) async {
    final box = Hive.box(_boxName);
    await box.put(key, true);
  }

  /// Reset a tutorial (useful for debugging).
  Future<void> reset(String key) async {
    final box = Hive.box(_boxName);
    await box.delete(key);
  }
}
