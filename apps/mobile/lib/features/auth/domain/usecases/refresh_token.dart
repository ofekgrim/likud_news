import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/auth_tokens.dart';
import '../repositories/auth_repository.dart';

@injectable
class RefreshToken implements UseCase<AuthTokens, RefreshTokenParams> {
  final AuthRepository _repository;

  RefreshToken(this._repository);

  @override
  Future<Either<Failure, AuthTokens>> call(RefreshTokenParams params) {
    return _repository.refreshTokens(
      refreshToken: params.refreshToken,
      deviceId: params.deviceId,
    );
  }
}

class RefreshTokenParams extends Equatable {
  final String refreshToken;
  final String deviceId;

  const RefreshTokenParams({
    required this.refreshToken,
    required this.deviceId,
  });

  @override
  List<Object?> get props => [refreshToken, deviceId];
}
