import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../auth/domain/repositories/auth_repository.dart';

@injectable
class RequestPhoneChange implements UseCase<void, RequestPhoneChangeParams> {
  final AuthRepository _repository;
  RequestPhoneChange(this._repository);

  @override
  Future<Either<Failure, void>> call(RequestPhoneChangeParams params) {
    return _repository.requestPhoneChange(phone: params.phone);
  }
}

class RequestPhoneChangeParams {
  final String phone;
  const RequestPhoneChangeParams({required this.phone});
}
