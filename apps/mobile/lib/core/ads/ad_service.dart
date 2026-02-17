import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:injectable/injectable.dart';

/// Singleton service responsible for initializing the Google Mobile Ads SDK.
///
/// Register via injectable DI and call [initialize] once during app startup,
/// typically in `main.dart` after `WidgetsFlutterBinding.ensureInitialized()`.
@lazySingleton
class AdService {
  bool _isInitialized = false;

  /// Whether the Mobile Ads SDK has been successfully initialized.
  bool get isInitialized => _isInitialized;

  /// Initializes the Google Mobile Ads SDK.
  ///
  /// This method is idempotent — calling it multiple times has no effect
  /// after the first successful initialization.
  Future<void> initialize() async {
    if (_isInitialized) return;

    await MobileAds.instance.initialize();
    _isInitialized = true;
  }
}
