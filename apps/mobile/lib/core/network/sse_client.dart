import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import '../constants/api_constants.dart';

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

  Stream<SseEvent> _connect(String path) {
    if (_controllers.containsKey(path) && !_controllers[path]!.isClosed) {
      return _controllers[path]!.stream;
    }

    final controller = StreamController<SseEvent>.broadcast(
      onCancel: () => _disconnect(path),
    );
    _controllers[path] = controller;
    _active[path] = true;
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
              controller.add(SseEvent(
                event: eventType ?? 'message',
                data: data,
              ));
              eventType = null;
              data = '';
            }
          }
        }
      } catch (e) {
        if (!(_active[path] ?? false)) break;
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
    _active[path] = false;
    _controllers[path]?.close();
    _controllers.remove(path);
    _active.remove(path);
  }

  /// Close all SSE connections.
  void dispose() {
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
