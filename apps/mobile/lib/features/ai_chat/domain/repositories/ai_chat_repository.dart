import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/chat_message.dart';
import '../entities/chat_session.dart';

/// Abstract contract for the AI chat data layer.
abstract class AiChatRepository {
  /// Creates a new chat session, optionally linked to a device ID.
  Future<Either<Failure, ChatSession>> createSession({String? deviceId});

  /// Sends a message in an existing session and returns the assistant reply.
  Future<Either<Failure, ChatMessage>> sendMessage(
    String sessionId,
    String message,
  );

  /// Retrieves an existing session by ID.
  Future<Either<Failure, ChatSession>> getSession(String sessionId);

  /// Submits user feedback (thumbs up/down) for a session.
  Future<Either<Failure, void>> provideFeedback(
    String sessionId,
    String feedback,
  );
}
