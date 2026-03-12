import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/chat_session.dart';
import '../repositories/ai_chat_repository.dart';

/// Creates a new AI chat session.
@injectable
class CreateChatSession implements UseCase<ChatSession, NoParams> {
  final AiChatRepository _repository;

  CreateChatSession(this._repository);

  @override
  Future<Either<Failure, ChatSession>> call(NoParams params) {
    return _repository.createSession();
  }
}
