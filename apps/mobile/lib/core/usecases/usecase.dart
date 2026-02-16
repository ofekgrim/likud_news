import 'package:dartz/dartz.dart';
import '../errors/failures.dart';

/// Abstract use case contract.
///
/// Every use case in the app implements this interface.
/// [Type] is the return type on success.
/// [Params] is the input parameter type.
abstract class UseCase<Type, Params> {
  Future<Either<Failure, Type>> call(Params params);
}

/// Use when a use case requires no parameters.
class NoParams {
  const NoParams();
}
