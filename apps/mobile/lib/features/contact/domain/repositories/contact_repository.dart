import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';

/// Abstract contract for the contact data layer.
///
/// Defines the operation for submitting a contact form.
abstract class ContactRepository {
  /// Submits a contact form with the given fields.
  ///
  /// Returns [Right(null)] on success, [Left(Failure)] on error.
  Future<Either<Failure, void>> submitContact({
    required String name,
    required String email,
    String? phone,
    required String subject,
    required String message,
  });
}
