import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../../../auth/domain/repositories/auth_repository.dart';

@injectable
class VerifyEmailChange implements UseCase<AppUser, VerifyEmailChangeParams> {
  final AuthRepository _repository;
  VerifyEmailChange(this._repository);

  @override
  Future<Either<Failure, AppUser>> call(VerifyEmailChangeParams params) {
    return _repository.verifyEmailChange(email: params.email, code: params.code);
  }
}

class VerifyEmailChangeParams {
  final String email;
  final String code;
  const VerifyEmailChangeParams({required this.email, required this.code});
}
