import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../models/chat_message_model.dart';
import '../models/chat_session_model.dart';

/// Remote datasource for AI chat operations.
///
/// Communicates with the backend AI chat endpoints.
abstract class AiChatRemoteDatasource {
  /// Creates a new chat session.
  ///
  /// Throws [ServerException] on failure.
  Future<ChatSessionModel> createSession({String? deviceId});

  /// Sends a message and returns the assistant reply.
  ///
  /// Throws [ServerException] on failure.
  Future<ChatMessageModel> sendMessage(String sessionId, String message);

  /// Retrieves an existing session by ID.
  ///
  /// Throws [ServerException] on failure.
  Future<ChatSessionModel> getSession(String sessionId);

  /// Submits user feedback for a session.
  ///
  /// Throws [ServerException] on failure.
  Future<void> provideFeedback(String sessionId, String feedback);
}

@LazySingleton(as: AiChatRemoteDatasource)
class AiChatRemoteDatasourceImpl implements AiChatRemoteDatasource {
  final ApiClient _apiClient;

  AiChatRemoteDatasourceImpl(this._apiClient);

  @override
  Future<ChatSessionModel> createSession({String? deviceId}) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiConstants.aiChatSessions,
        data: {
          if (deviceId != null) 'deviceId': deviceId,
        },
      );
      final data = response.data?['data'] as Map<String, dynamic>? ??
          response.data ??
          {};
      return ChatSessionModel.fromJson(data);
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(message: e.toString());
    }
  }

  @override
  Future<ChatMessageModel> sendMessage(
    String sessionId,
    String message,
  ) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiConstants.aiChat,
        data: {
          'sessionId': sessionId,
          'message': message,
        },
      );
      final data = response.data?['data'] as Map<String, dynamic>? ??
          response.data ??
          {};
      return ChatMessageModel.fromJson(data);
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(message: e.toString());
    }
  }

  @override
  Future<ChatSessionModel> getSession(String sessionId) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        '${ApiConstants.aiChatSessions}/$sessionId',
      );
      final data = response.data?['data'] as Map<String, dynamic>? ??
          response.data ??
          {};
      return ChatSessionModel.fromJson(data);
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(message: e.toString());
    }
  }

  @override
  Future<void> provideFeedback(String sessionId, String feedback) async {
    try {
      await _apiClient.post<dynamic>(
        '${ApiConstants.aiChatSessions}/$sessionId/feedback',
        data: {'feedback': feedback},
      );
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(message: e.toString());
    }
  }
}
