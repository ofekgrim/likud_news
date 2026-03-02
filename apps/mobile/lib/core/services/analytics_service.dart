import 'package:injectable/injectable.dart';

import '../constants/api_constants.dart';
import '../network/api_client.dart';
import '../services/app_logger.dart';
import '../services/device_id_service.dart';

/// Fire-and-forget analytics tracking service.
///
/// Sends article engagement events to the backend analytics endpoint.
/// All calls are best-effort — errors are logged but never thrown.
@lazySingleton
class AnalyticsService {
  final ApiClient _apiClient;
  final DeviceIdService _deviceIdService;

  AnalyticsService(this._apiClient, this._deviceIdService);

  /// Track an analytics event. Fire-and-forget — errors are logged, not thrown.
  Future<void> trackEvent({
    required String articleId,
    required String eventType,
    String? platform,
    String? referrer,
    int? readTimeSeconds,
    int? scrollDepthPercent,
  }) async {
    try {
      final deviceId = _deviceIdService.deviceId;
      await _apiClient.post(
        ApiConstants.articleAnalyticsTrack,
        data: {
          'articleId': articleId,
          'eventType': eventType,
          'deviceId': deviceId,
          if (platform != null) 'platform': platform,
          if (referrer != null) 'referrer': referrer,
          if (readTimeSeconds != null) 'readTimeSeconds': readTimeSeconds,
          if (scrollDepthPercent != null)
            'scrollDepthPercent': scrollDepthPercent,
        },
      );
    } catch (e) {
      AppLogger.warning('Analytics track failed', e);
    }
  }
}
