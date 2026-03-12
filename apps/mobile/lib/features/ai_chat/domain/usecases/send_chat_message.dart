import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/chat_message.dart';
import '../repositories/ai_chat_repository.dart';

/// Sends a message in an existing AI chat session.
@injectable
class SendChatMessage implements UseCase<ChatMessage, SendChatMessageParams> {
  final AiChatRepository _repository;

  SendChatMessage(this._repository);

  @override
  Future<Either<Failure, ChatMessage>> call(SendChatMessageParams params) {
    return _repository.sendMessage(params.sessionId, params.message);
  }
}

/// Parameters for the [SendChatMessage] use case.
class SendChatMessageParams extends Equatable {
  final String sessionId;
  final String message;

  const SendChatMessageParams({
    required this.sessionId,
    required this.message,
  });

  @override
  List<Object?> get props => [sessionId, message];
}
