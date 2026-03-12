import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/subscription_info.dart';
import '../../domain/repositories/premium_repository.dart';
import '../datasources/premium_remote_datasource.dart';

/// Concrete implementation of [PremiumRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: PremiumRepository)
class PremiumRepositoryImpl implements PremiumRepository {
  final PremiumRemoteDataSource _remoteDataSource;

  PremiumRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, SubscriptionInfo?>> getSubscription() async {
    try {
      // Fetch benefits in parallel with subscription info
      final results = await Future.wait([
        _remoteDataSource.getSubscription(),
        _remoteDataSource.getVipBenefits(),
      ]);

      final subModel = results[0];
      final benefits = results[1] as List;

      if (subModel == null) {
        // No active subscription, but still return benefits info
        return Right(SubscriptionInfo(
          benefits: benefits.map((b) => (b as dynamic).toEntity()).toList().cast(),
        ));
      }

      final model = (subModel as dynamic).withBenefits(benefits);
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, SubscriptionInfo>> cancelSubscription() async {
    try {
      final model = await _remoteDataSource.cancelSubscription();
      return Right(model.toEntity());
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
        if (statusCode == 401) {
          return const UnauthorizedFailure();
        }
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
