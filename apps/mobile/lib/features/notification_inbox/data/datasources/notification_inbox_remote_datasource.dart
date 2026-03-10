import 'package:injectable/injectable.dart';
import '../../../../core/network/api_client.dart';
import '../models/notification_item_model.dart';

abstract class NotificationInboxRemoteDataSource {
  Future<List<NotificationItemModel>> getNotifications({
    required String deviceId,
    int page = 1,
    int limit = 20,
  });

  Future<void> markAsOpened({
    required String logId,
    required String deviceId,
  });

  Future<void> markAllAsRead({required String deviceId});

  Future<void> dismissNotification({
    required String logId,
    required String deviceId,
  });
}

@LazySingleton(as: NotificationInboxRemoteDataSource)
class NotificationInboxRemoteDataSourceImpl
    implements NotificationInboxRemoteDataSource {
  final ApiClient _apiClient;

  NotificationInboxRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<NotificationItemModel>> getNotifications({
    required String deviceId,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.get<dynamic>(
      '/notifications/inbox',
      queryParameters: {
        'deviceId': deviceId,
        'page': page.toString(),
        'limit': limit.toString(),
      },
    );

    final responseData = response.data;
    final List<dynamic> items;

    if (responseData is Map<String, dynamic>) {
      items = (responseData['data'] ?? []) as List<dynamic>;
    } else if (responseData is List) {
      items = responseData;
    } else {
      items = [];
    }

    return items
        .cast<Map<String, dynamic>>()
        .map((json) => NotificationItemModel.fromJson(json))
        .toList();
  }

  @override
  Future<void> markAsOpened({
    required String logId,
    required String deviceId,
  }) async {
    await _apiClient.post(
      '/notifications/track-open',
      data: {'logId': logId, 'deviceId': deviceId},
    );
  }

  @override
  Future<void> markAllAsRead({required String deviceId}) async {
    await _apiClient.post(
      '/notifications/inbox/read-all',
      data: {'deviceId': deviceId},
    );
  }

  @override
  Future<void> dismissNotification({
    required String logId,
    required String deviceId,
  }) async {
    await _apiClient.delete('/notifications/inbox/$logId?deviceId=$deviceId');
  }
}
