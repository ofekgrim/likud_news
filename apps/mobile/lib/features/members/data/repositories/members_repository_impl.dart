import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/member.dart';
import '../../domain/entities/member_detail.dart';
import '../../domain/repositories/members_repository.dart';
import '../datasources/members_remote_datasource.dart';

/// Concrete implementation of [MembersRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: MembersRepository)
class MembersRepositoryImpl implements MembersRepository {
  final MembersRemoteDataSource _remoteDataSource;

  MembersRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<Member>>> getMembers() async {
    try {
      final models = await _remoteDataSource.getMembers();
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, MemberDetail>> getMemberDetail(String id) async {
    try {
      final memberModel = await _remoteDataSource.getMemberDetail(id);
      final articleModels = await _remoteDataSource.getMemberArticles(id);
      return Right(MemberDetail(
        member: memberModel.toEntity(),
        articles: articleModels.map((m) => m.toEntity()).toList(),
      ));
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  /// Maps Dio exceptions to domain [Failure] types.
  Failure _mapDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return const NetworkFailure();
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final message =
            e.response?.data is Map<String, dynamic>
                ? (e.response!.data as Map<String, dynamic>)['message']
                    as String?
                : null;
        return ServerFailure(
          message: message ?? 'Server error',
          statusCode: statusCode,
        );
      default:
        return ServerFailure(message: e.message ?? 'Unexpected error');
    }
  }
}
