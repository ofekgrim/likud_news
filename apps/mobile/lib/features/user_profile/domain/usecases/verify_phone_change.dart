import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../../../auth/domain/repositories/auth_repository.dart';

@injectable
class VerifyPhoneChange implements UseCase<AppUser, VerifyPhoneChangeParams> {
  final AuthRepository _repository;
  VerifyPhoneChange(this._repository);

  @override
  Future<Either<Failure, AppUser>> call(VerifyPhoneChangeParams params) {
    return _repository.verifyPhoneChange(phone: params.phone, code: params.code);
  }
}

class VerifyPhoneChangeParams {
  final String phone;
  final String code;
  const VerifyPhoneChangeParams({required this.phone, required this.code});
}
