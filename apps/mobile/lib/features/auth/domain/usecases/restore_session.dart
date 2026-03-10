import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/app_user.dart';
import '../repositories/auth_repository.dart';

@injectable
class RestoreSession implements UseCase<AppUser, NoParams> {
  final AuthRepository _repository;

  RestoreSession(this._repository);

  @override
  Future<Either<Failure, AppUser>> call(NoParams params) {
    return _repository.getProfile();
  }
}
