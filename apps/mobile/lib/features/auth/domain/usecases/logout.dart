import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/auth_repository.dart';

@injectable
class Logout implements UseCase<void, LogoutParams> {
  final AuthRepository _repository;

  Logout(this._repository);

  @override
  Future<Either<Failure, void>> call(LogoutParams params) {
    return _repository.logout(deviceId: params.deviceId);
  }
}

class LogoutParams extends Equatable {
  final String deviceId;

  const LogoutParams({required this.deviceId});

  @override
  List<Object?> get props => [deviceId];
}
