import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import '../constants/api_constants.dart';
import '../services/app_logger.dart';

/// Server-Sent Events client with auto-reconnect.
///
/// Connects to backend SSE endpoints for real-time ticker
/// and breaking news updates.
@lazySingleton
class SseClient {
  final Dio _dio;
  final Map<String, StreamController<SseEvent>> _controllers = {};
  final Map<String, bool> _active = {};

  static const _reconnectDelay = Duration(seconds: 3);
  static const _maxReconnectDelay = Duration(seconds: 30);

  SseClient()
      : _dio = Dio(
          BaseOptions(
            baseUrl: ApiConstants.baseUrl,
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(minutes: 30),
          ),
        );

  /// Subscribe to the breaking news ticker SSE stream.
  Stream<SseEvent> tickerStream() => _connect(ApiConstants.sseTicker);

  /// Subscribe to breaking news SSE stream.
  Stream<SseEvent> breakingStream() => _connect(ApiConstants.sseBreaking);

  /// Subscribe to primaries live results SSE stream.
  Stream<SseEvent> primariesStream() => _connect(ApiConstants.ssePrimaries);

  /// Subscribe to new article notifications SSE stream.
  Stream<SseEvent> articlesStream() => _connect(ApiConstants.sseArticles);

  /// Subscribe to mixed-content feed updates SSE stream.
  Stream<SseEvent> feedStream() => _connect(ApiConstants.sseFeed);

  Stream<SseEvent> _connect(String path) {
    if (_controllers.containsKey(path) && !_controllers[path]!.isClosed) {
      return _controllers[path]!.stream;
    }

    final controller = StreamController<SseEvent>.broadcast(
      onCancel: () => _disconnect(path),
    );
    _controllers[path] = controller;
    _active[path] = true;

    AppLogger.info('SSE connecting to $path');
    _startListening(path, controller);
    return controller.stream;
  }

  Future<void> _startListening(
    String path,
    StreamController<SseEvent> controller,
  ) async {
    var delay = _reconnectDelay;

    while (_active[path] == true && !controller.isClosed) {
      try {
        final response = await _dio.get<ResponseBody>(
          path,
          options: Options(
            responseType: ResponseType.stream,
            headers: {'Accept': 'text/event-stream'},
          ),
        );

        final stream = response.data?.stream;
        if (stream == null) continue;

        // Reset delay on successful connection.
        delay = _reconnectDelay;
        AppLogger.info('SSE connected to $path');

        String buffer = '';
        await for (final chunk in stream) {
          if (!(_active[path] ?? false)) break;

          buffer += utf8.decode(chunk);
          final lines = buffer.split('\n');
          // Keep the last incomplete line in the buffer.
          buffer = lines.removeLast();

          String? eventType;
          String data = '';

          for (final line in lines) {
            if (line.startsWith('event:')) {
              eventType = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              data += line.substring(5).trim();
            } else if (line.isEmpty && data.isNotEmpty) {
              // Empty line = event boundary.
              AppLogger.debug('SSE event on $path: ${eventType ?? "message"}');
              controller.add(SseEvent(
                event: eventType ?? 'message',
                data: data,
              ));
              eventType = null;
              data = '';
            }
          }
        }
      } catch (e, stack) {
        if (!(_active[path] ?? false)) break;

        AppLogger.warning(
          'SSE disconnected from $path, reconnecting in ${delay.inSeconds}s',
          e,
          stack,
        );

        // Exponential backoff.
        await Future<void>.delayed(delay);
        delay = Duration(
          milliseconds: (delay.inMilliseconds * 1.5)
              .clamp(0, _maxReconnectDelay.inMilliseconds)
              .toInt(),
        );
      }
    }
  }

  void _disconnect(String path) {
    AppLogger.info('SSE disconnecting from $path');
    _active[path] = false;
    _controllers[path]?.close();
    _controllers.remove(path);
    _active.remove(path);
  }

  /// Close all SSE connections.
  void dispose() {
    AppLogger.info('SSE disposing all connections');
    for (final path in List<String>.from(_controllers.keys)) {
      _disconnect(path);
    }
  }
}

/// A single SSE event.
class SseEvent {
  final String event;
  final String data;

  const SseEvent({required this.event, required this.data});

  /// Parse the data field as JSON.
  Map<String, dynamic> get json =>
      jsonDecode(data) as Map<String, dynamic>;

  @override
  String toString() => 'SseEvent(event: $event, data: $data)';
}
