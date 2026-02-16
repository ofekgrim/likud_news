import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:get_it/get_it.dart';
import 'package:injectable/injectable.dart';

import 'di.config.dart';

final getIt = GetIt.instance;

@InjectableInit(preferRelativeImports: true)
void configureDependencies() {
  // Register external dependencies that injectable can't auto-detect
  getIt.registerLazySingleton(() => Connectivity());

  // Initialize all auto-generated registrations
  getIt.init();
}
