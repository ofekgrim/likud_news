import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/chat_message.dart';
import '../../domain/entities/chat_session.dart';
import '../../domain/repositories/ai_chat_repository.dart';
import '../datasources/ai_chat_remote_datasource.dart';

/// Concrete implementation of [AiChatRepository].
///
/// Delegates to the remote datasource and translates exceptions
/// into typed [Failure] objects for the domain layer.
@LazySingleton(as: AiChatRepository)
class AiChatRepositoryImpl implements AiChatRepository {
  final AiChatRemoteDatasource _remoteDatasource;

  AiChatRepositoryImpl(this._remoteDatasource);

  @override
  Future<Either<Failure, ChatSession>> createSession({
    String? deviceId,
  }) async {
    try {
      final model = await _remoteDatasource.createSession(deviceId: deviceId);
      return Right(model.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, ChatMessage>> sendMessage(
    String sessionId,
    String message,
  ) async {
    try {
      final model = await _remoteDatasource.sendMessage(sessionId, message);
      return Right(model.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, ChatSession>> getSession(String sessionId) async {
    try {
      final model = await _remoteDatasource.getSession(sessionId);
      return Right(model.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> provideFeedback(
    String sessionId,
    String feedback,
  ) async {
    try {
      await _remoteDatasource.provideFeedback(sessionId, feedback);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
