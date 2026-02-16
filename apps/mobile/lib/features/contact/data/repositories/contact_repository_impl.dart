import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/repositories/contact_repository.dart';
import '../datasources/contact_remote_datasource.dart';

/// Concrete implementation of [ContactRepository].
///
/// Delegates to the remote datasource and translates exceptions
/// into typed [Failure] objects for the domain layer.
@LazySingleton(as: ContactRepository)
class ContactRepositoryImpl implements ContactRepository {
  final ContactRemoteDatasource _remoteDatasource;

  ContactRepositoryImpl(this._remoteDatasource);

  @override
  Future<Either<Failure, void>> submitContact({
    required String name,
    required String email,
    String? phone,
    required String subject,
    required String message,
  }) async {
    try {
      await _remoteDatasource.submitContact(
        name: name,
        email: email,
        phone: phone,
        subject: subject,
        message: message,
      );
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
