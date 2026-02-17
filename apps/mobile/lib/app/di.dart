import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:get_it/get_it.dart';
import 'package:injectable/injectable.dart';

import '../core/network/api_client.dart';
import '../core/services/device_id_service.dart';
import '../core/services/push_notification_service.dart';
import 'di.config.dart';

final getIt = GetIt.instance;

@InjectableInit(preferRelativeImports: true)
void configureDependencies() {
  // Register external dependencies
  getIt.registerLazySingleton(() => Connectivity());

  // Initialize all auto-generated registrations
  getIt.init();

  // Register PushNotificationService (depends on ApiClient + DeviceIdService)
  getIt.registerLazySingleton<PushNotificationService>(
    () => PushNotificationService(
      getIt<ApiClient>(),
      getIt<DeviceIdService>(),
    ),
  );
}
