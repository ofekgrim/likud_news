import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../auth/domain/repositories/auth_repository.dart';

@injectable
class RequestEmailChange implements UseCase<void, RequestEmailChangeParams> {
  final AuthRepository _repository;
  RequestEmailChange(this._repository);

  @override
  Future<Either<Failure, void>> call(RequestEmailChangeParams params) {
    return _repository.requestEmailChange(
      email: params.email,
      currentPassword: params.currentPassword,
    );
  }
}

class RequestEmailChangeParams {
  final String email;
  final String currentPassword;
  const RequestEmailChangeParams({
    required this.email,
    required this.currentPassword,
  });
}
