import 'package:equatable/equatable.dart';

/// Base failure class for error handling across the app.
///
/// Used with `Either<Failure, T>` from dartz to force callers
/// to handle both success and error cases.
sealed class Failure extends Equatable {
  final String? message;
  final int? statusCode;

  const Failure({this.message, this.statusCode});

  @override
  List<Object?> get props => [message, statusCode];
}

class ServerFailure extends Failure {
  const ServerFailure({super.message, super.statusCode});
}

class CacheFailure extends Failure {
  const CacheFailure({super.message});
}

class NetworkFailure extends Failure {
  const NetworkFailure({super.message = 'No internet connection'});
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure({super.message = 'Unauthorized'});
}

class NotFoundFailure extends Failure {
  const NotFoundFailure({super.message = 'Resource not found'});
}
