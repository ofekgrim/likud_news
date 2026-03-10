import 'dart:async';

import 'package:flutter/foundation.dart';

/// Converts a [Stream] (e.g. from a BLoC) into a [ChangeNotifier]
/// that GoRouter can use via its `refreshListenable` parameter.
class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
