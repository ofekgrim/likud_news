import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:injectable/injectable.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/services/app_logger.dart';
import '../models/candidate_result_model.dart';
import '../models/knesset_slot_model.dart';
import '../models/turnout_data_model.dart';
import '../../domain/entities/candidate_result.dart';
import '../../domain/entities/knesset_slot.dart';
import '../../domain/entities/turnout_data.dart';

/// WebSocket data source for real-time election results, turnout, and
/// knesset list assembly updates.
///
/// Connects to the backend WebSocket at `/ws` namespace.
/// Auto-reconnects with exponential backoff (1s, 2s, 4s, max 30s).
/// Falls back to SSE if WebSocket connection fails 3 times consecutively.
abstract class ElectionDayWsDataSource {
  /// Connect to the WebSocket and join the election room.
  Future<void> connect(String electionId);

  /// Disconnect from the WebSocket and leave the room.
  Future<void> disconnect();

  /// Stream of candidate results updates.
  Stream<List<CandidateResult>> get resultsStream;

  /// Stream of turnout data updates.
  Stream<TurnoutData> get turnoutStream;

  /// Stream of knesset list assembly updates.
  Stream<List<KnessetSlot>> get listUpdateStream;

  /// Stream of connection status changes.
  Stream<WsConnectionStatus> get connectionStatusStream;

  /// Whether currently connected.
  bool get isConnected;

  /// Whether we have fallen back to SSE.
  bool get isSseFallback;

  /// Dispose of resources (streams, channels).
  void dispose();
}

/// Connection status for the WebSocket.
enum WsConnectionStatus {
  connected,
  reconnecting,
  disconnected,
}

/// Implementation of [ElectionDayWsDataSource] using web_socket_channel.
@LazySingleton(as: ElectionDayWsDataSource)
class ElectionDayWsDataSourceImpl implements ElectionDayWsDataSource {
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _subscription;
  Timer? _reconnectTimer;

  String? _currentElectionId;
  int _failureCount = 0;
  bool _isConnected = false;
  bool _isSseFallback = false;
  bool _intentionalDisconnect = false;

  static const int _maxWsFailures = 3;
  static const int _maxReconnectDelayMs = 30000;
  static const int _baseReconnectDelayMs = 1000;

  final _resultsController =
      StreamController<List<CandidateResult>>.broadcast();
  final _turnoutController = StreamController<TurnoutData>.broadcast();
  final _listUpdateController =
      StreamController<List<KnessetSlot>>.broadcast();
  final _connectionStatusController =
      StreamController<WsConnectionStatus>.broadcast();

  @override
  Stream<List<CandidateResult>> get resultsStream => _resultsController.stream;

  @override
  Stream<TurnoutData> get turnoutStream => _turnoutController.stream;

  @override
  Stream<List<KnessetSlot>> get listUpdateStream =>
      _listUpdateController.stream;

  @override
  Stream<WsConnectionStatus> get connectionStatusStream =>
      _connectionStatusController.stream;

  @override
  bool get isConnected => _isConnected;

  @override
  bool get isSseFallback => _isSseFallback;

  @override
  Future<void> connect(String electionId) async {
    _currentElectionId = electionId;
    _intentionalDisconnect = false;
    _failureCount = 0;
    _isSseFallback = false;
    await _connectWs();
  }

  @override
  Future<void> disconnect() async {
    _intentionalDisconnect = true;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    await _subscription?.cancel();
    _subscription = null;
    await _channel?.sink.close();
    _channel = null;
    _isConnected = false;
    _connectionStatusController.add(WsConnectionStatus.disconnected);
  }

  Future<void> _connectWs() async {
    if (_intentionalDisconnect) return;

    try {
      // Build WebSocket URL from the API base URL.
      final baseUrl = ApiConstants.baseUrl;
      final wsBase = baseUrl
          .replaceFirst('https://', 'wss://')
          .replaceFirst('http://', 'ws://');
      // Remove /api/v1 suffix for the WS namespace.
      final wsUrl = wsBase.replaceAll(RegExp(r'/api/v\d+$'), '');
      final uri = Uri.parse('$wsUrl/ws');

      AppLogger.info('WS connecting to $uri');

      _channel = WebSocketChannel.connect(uri);
      await _channel!.ready;

      _isConnected = true;
      _failureCount = 0;
      _connectionStatusController.add(WsConnectionStatus.connected);
      AppLogger.info('WS connected');

      // Join the election room.
      _channel!.sink.add(jsonEncode({
        'type': 'join',
        'electionId': _currentElectionId,
      }));

      _subscription = _channel!.stream.listen(
        _onMessage,
        onDone: _onDisconnected,
        onError: _onError,
      );
    } catch (e, stack) {
      AppLogger.warning('WS connection failed', e, stack);
      _isConnected = false;
      _failureCount++;

      if (_failureCount >= _maxWsFailures) {
        AppLogger.info(
          'WS failed $_failureCount times, falling back to SSE',
        );
        _isSseFallback = true;
        _connectionStatusController.add(WsConnectionStatus.disconnected);
        return;
      }

      _connectionStatusController.add(WsConnectionStatus.reconnecting);
      _scheduleReconnect();
    }
  }

  void _onMessage(dynamic message) {
    try {
      final json = jsonDecode(message as String) as Map<String, dynamic>;
      final type = json['type'] as String?;

      switch (type) {
        case 'results_update':
          _handleResultsUpdate(json);
          break;
        case 'turnout_update':
          _handleTurnoutUpdate(json);
          break;
        case 'list_update':
          _handleListUpdate(json);
          break;
        case 'pong':
          // Keep-alive response, ignore.
          break;
        default:
          AppLogger.debug('WS unknown message type: $type');
      }
    } catch (e, stack) {
      AppLogger.warning('WS message parse error', e, stack);
    }
  }

  void _handleResultsUpdate(Map<String, dynamic> json) {
    final List<dynamic> items;
    if (json.containsKey('data')) {
      items = json['data'] as List<dynamic>;
    } else if (json.containsKey('results')) {
      items = json['results'] as List<dynamic>;
    } else {
      return;
    }

    final results = items
        .map((item) =>
            CandidateResultModel.fromJson(item as Map<String, dynamic>)
                .toEntity())
        .toList();

    if (!_resultsController.isClosed) {
      _resultsController.add(results);
    }
  }

  void _handleTurnoutUpdate(Map<String, dynamic> json) {
    final Map<String, dynamic> data;
    if (json.containsKey('data') && json['data'] is Map<String, dynamic>) {
      data = json['data'] as Map<String, dynamic>;
    } else {
      data = json;
    }

    final turnout = TurnoutDataModel.fromJson(data).toEntity();
    if (!_turnoutController.isClosed) {
      _turnoutController.add(turnout);
    }
  }

  void _handleListUpdate(Map<String, dynamic> json) {
    final List<dynamic> items;
    if (json.containsKey('data')) {
      items = json['data'] as List<dynamic>;
    } else if (json.containsKey('slots')) {
      items = json['slots'] as List<dynamic>;
    } else {
      return;
    }

    final slots = items
        .map((item) =>
            KnessetSlotModel.fromJson(item as Map<String, dynamic>).toEntity())
        .toList();

    if (!_listUpdateController.isClosed) {
      _listUpdateController.add(slots);
    }
  }

  void _onDisconnected() {
    _isConnected = false;
    if (_intentionalDisconnect) {
      _connectionStatusController.add(WsConnectionStatus.disconnected);
      return;
    }

    AppLogger.info('WS disconnected unexpectedly, will reconnect');
    _connectionStatusController.add(WsConnectionStatus.reconnecting);
    _failureCount++;

    if (_failureCount >= _maxWsFailures) {
      _isSseFallback = true;
      _connectionStatusController.add(WsConnectionStatus.disconnected);
      return;
    }

    _scheduleReconnect();
  }

  void _onError(Object error, StackTrace stackTrace) {
    AppLogger.warning('WS stream error', error, stackTrace);
    _isConnected = false;
    _failureCount++;

    if (_failureCount >= _maxWsFailures) {
      _isSseFallback = true;
      _connectionStatusController.add(WsConnectionStatus.disconnected);
      return;
    }

    _connectionStatusController.add(WsConnectionStatus.reconnecting);
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    final delayMs = math.min(
      _baseReconnectDelayMs * math.pow(2, _failureCount - 1).toInt(),
      _maxReconnectDelayMs,
    );
    AppLogger.info('WS reconnecting in ${delayMs}ms (attempt $_failureCount)');

    _reconnectTimer = Timer(Duration(milliseconds: delayMs), () {
      if (!_intentionalDisconnect) {
        _connectWs();
      }
    });
  }

  /// Disposes all resources. Called when the singleton is destroyed.
  @disposeMethod
  void dispose() {
    _intentionalDisconnect = true;
    _reconnectTimer?.cancel();
    _subscription?.cancel();
    _channel?.sink.close();
    _resultsController.close();
    _turnoutController.close();
    _listUpdateController.close();
    _connectionStatusController.close();
  }
}
