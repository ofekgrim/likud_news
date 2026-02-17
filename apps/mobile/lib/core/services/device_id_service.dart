import 'dart:math';

import 'package:hive_flutter/hive_flutter.dart';

/// Generates and persists a unique device identifier using Hive.
///
/// Must be initialized via [init] before accessing [deviceId].
/// Registered manually in main.dart before DI configuration.
class DeviceIdService {
  static const String _boxName = 'app_settings';
  static const String _deviceIdKey = 'device_id';

  late final String deviceId;

  /// Initializes Hive and loads or generates the device ID.
  Future<void> init() async {
    await Hive.initFlutter();
    final box = await Hive.openBox<String>(_boxName);

    final existing = box.get(_deviceIdKey);
    if (existing != null && existing.isNotEmpty) {
      deviceId = existing;
    } else {
      deviceId = _generateUuidV4();
      await box.put(_deviceIdKey, deviceId);
    }
  }

  /// Generates an RFC 4122 v4 UUID using cryptographically secure random.
  String _generateUuidV4() {
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));

    // Set version (4) and variant (10xx) bits per RFC 4122
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-'
        '${hex.substring(12, 16)}-${hex.substring(16, 20)}-'
        '${hex.substring(20, 32)}';
  }
}
