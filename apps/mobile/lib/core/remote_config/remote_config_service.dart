import 'package:firebase_remote_config/firebase_remote_config.dart';

/// Singleton wrapper around Firebase Remote Config.
///
/// Flags are read from Firebase Console and cached locally.
/// Defaults ensure the app works even with no network connectivity.
///
/// Usage:
///   if (RemoteConfigService.instance.electionDayMode) { ... }
class RemoteConfigService {
  RemoteConfigService._();
  static final RemoteConfigService instance = RemoteConfigService._();

  final _rc = FirebaseRemoteConfig.instance;

  Future<void> init() async {
    try {
      await _rc.setDefaults({
        'ai_chat_enabled': false,
        'ama_enabled': true,
        'donations_enabled': false,
        'premium_enabled': false,
        'election_day_mode': false,
        'maintenance_mode': false,
        'gotv_enabled': true,
        'candidate_matcher_enabled': true,
      });
      await _rc.setConfigSettings(
        RemoteConfigSettings(
          fetchTimeout: const Duration(seconds: 10),
          minimumFetchInterval: const Duration(hours: 1),
        ),
      );
      await _rc.fetchAndActivate();
    } catch (_) {
      // Remote config failure is non-fatal — defaults apply
    }
  }

  bool get aiChatEnabled => _rc.getBool('ai_chat_enabled');
  bool get amaEnabled => _rc.getBool('ama_enabled');
  bool get donationsEnabled => _rc.getBool('donations_enabled');
  bool get premiumEnabled => _rc.getBool('premium_enabled');
  bool get electionDayMode => _rc.getBool('election_day_mode');
  bool get maintenanceMode => _rc.getBool('maintenance_mode');
  bool get gotvEnabled => _rc.getBool('gotv_enabled');
  bool get candidateMatcherEnabled => _rc.getBool('candidate_matcher_enabled');
}
