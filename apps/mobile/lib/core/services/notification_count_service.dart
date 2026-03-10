import 'package:flutter/foundation.dart';

import '../constants/api_constants.dart';
import '../network/api_client.dart';
import 'device_id_service.dart';

/// Lightweight singleton service that tracks unread notification count.
///
/// Exposes a [ValueNotifier] so any widget (e.g. RtlScaffold bell icon)
/// can listen without needing a full BLoC provider tree.
class NotificationCountService {
  final ApiClient _apiClient;
  final DeviceIdService _deviceIdService;

  final ValueNotifier<int> unreadCount = ValueNotifier<int>(0);

  NotificationCountService(this._apiClient, this._deviceIdService);

  /// Fetch the current unread count from the backend.
  Future<void> refresh() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiConstants.notificationUnreadCount,
        queryParameters: {'deviceId': _deviceIdService.deviceId},
      );
      final count = response.data?['count'] as int? ?? 0;
      unreadCount.value = count;
    } catch (_) {
      // Silently fail — badge is non-critical
    }
  }

  /// Optimistically increment when a foreground push arrives.
  void increment() {
    unreadCount.value++;
  }

  /// Optimistically decrement after marking a notification as read.
  void decrement() {
    if (unreadCount.value > 0) {
      unreadCount.value--;
    }
  }
}
