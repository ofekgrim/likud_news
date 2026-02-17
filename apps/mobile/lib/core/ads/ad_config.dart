import 'dart:io';

/// Centralized Google AdMob ad unit ID configuration.
///
/// Toggle [_useTestAds] to switch between test and production ad unit IDs.
/// In production, replace the placeholder IDs with real ad unit IDs from
/// the AdMob dashboard.
class AdConfig {
  AdConfig._();

  /// Set to `false` before releasing to production.
  static const bool _useTestAds = true;

  // ---------------------------------------------------------------------------
  // Test ad unit IDs (Google-provided)
  // ---------------------------------------------------------------------------
  static const String _testBannerAndroid =
      'ca-app-pub-3940256099942544/6300978111';
  static const String _testBannerIos =
      'ca-app-pub-3940256099942544/2934735716';
  static const String _testNativeAndroid =
      'ca-app-pub-3940256099942544/2247696110';
  static const String _testNativeIos =
      'ca-app-pub-3940256099942544/3986624511';

  // ---------------------------------------------------------------------------
  // Production ad unit IDs (replace with real values from AdMob dashboard)
  // ---------------------------------------------------------------------------
  static const String _prodBannerAndroid =
      'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';
  static const String _prodBannerIos =
      'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';
  static const String _prodNativeAndroid =
      'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';
  static const String _prodNativeIos =
      'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';

  // ---------------------------------------------------------------------------
  // Platform-aware getters
  // ---------------------------------------------------------------------------

  /// Returns the appropriate banner ad unit ID for the current platform.
  static String get bannerAdUnitId {
    if (_useTestAds) {
      return Platform.isAndroid ? _testBannerAndroid : _testBannerIos;
    }
    return Platform.isAndroid ? _prodBannerAndroid : _prodBannerIos;
  }

  /// Returns the appropriate native ad unit ID for the current platform.
  static String get nativeAdUnitId {
    if (_useTestAds) {
      return Platform.isAndroid ? _testNativeAndroid : _testNativeIos;
    }
    return Platform.isAndroid ? _prodNativeAndroid : _prodNativeIos;
  }

  // ---------------------------------------------------------------------------
  // Ad placement constants
  // ---------------------------------------------------------------------------

  /// Number of paragraphs before the first inline ad in article content.
  static const int firstAdAfterParagraph = 3;

  /// Number of paragraphs before the second inline ad in article content.
  static const int secondAdAfterParagraph = 7;
}
