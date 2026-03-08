import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:get_it/get_it.dart';
import 'package:injectable/injectable.dart';
import 'package:talker_flutter/talker_flutter.dart';

import '../core/network/api_client.dart';
import '../core/network/auth_interceptor.dart';
import '../core/services/app_logger.dart';
import '../core/services/device_id_service.dart';
import '../core/services/notification_count_service.dart';
import '../core/services/push_notification_service.dart';
import '../core/services/secure_storage_service.dart';
import '../features/auth/domain/repositories/auth_repository.dart';
import 'di.config.dart';

final getIt = GetIt.instance;

@InjectableInit(preferRelativeImports: true)
void configureDependencies() {
  // Register Talker logger instance for DI access
  getIt.registerSingleton<Talker>(AppLogger.instance);

  // Register external dependencies
  getIt.registerLazySingleton(() => Connectivity());

  // Initialize all auto-generated registrations
  getIt.init();

  // Wire AuthInterceptor into ApiClient's Dio instance.
  // Done here (after init) to avoid circular dependency:
  // ApiClient → AuthInterceptor → AuthRepository → ApiClient
  final apiClient = getIt<ApiClient>();
  apiClient.dio.interceptors.insert(
    0,
    AuthInterceptor(
      secureStorage: getIt<SecureStorageService>(),
      authRepository: getIt<AuthRepository>(),
      dio: apiClient.dio,
      deviceId: getIt<DeviceIdService>().deviceId,
    ),
  );

  // Register NotificationCountService for bell icon badge
  getIt.registerLazySingleton<NotificationCountService>(
    () => NotificationCountService(
      getIt<ApiClient>(),
      getIt<DeviceIdService>(),
    ),
  );

  // Register PushNotificationService (depends on ApiClient + DeviceIdService + NotificationCountService)
  getIt.registerLazySingleton<PushNotificationService>(
    () => PushNotificationService(
      getIt<ApiClient>(),
      getIt<DeviceIdService>(),
      getIt<NotificationCountService>(),
    ),
  );

}
