import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/auth_repository.dart';

@injectable
class RequestOtp implements UseCase<void, RequestOtpParams> {
  final AuthRepository _repository;

  RequestOtp(this._repository);

  @override
  Future<Either<Failure, void>> call(RequestOtpParams params) {
    return _repository.requestOtp(phone: params.phone);
  }
}

class RequestOtpParams extends Equatable {
  final String phone;

  const RequestOtpParams({required this.phone});

  @override
  List<Object?> get props => [phone];
}
