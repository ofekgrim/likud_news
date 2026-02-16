import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:get_it/get_it.dart';
import 'package:injectable/injectable.dart';

final getIt = GetIt.instance;

@InjectableInit(preferRelativeImports: true)
void configureDependencies() {
  // Register external dependencies that injectable can't auto-detect
  getIt.registerLazySingleton(() => Connectivity());

  // Auto-generated registrations will be in di.config.dart
  // Run: dart run build_runner build --delete-conflicting-outputs
}
