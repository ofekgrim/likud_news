import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/contact_repository.dart';

/// Submits a contact form to the server.
@lazySingleton
class SubmitContact implements UseCase<void, ContactParams> {
  final ContactRepository _repository;

  SubmitContact(this._repository);

  @override
  Future<Either<Failure, void>> call(ContactParams params) {
    return _repository.submitContact(
      name: params.name,
      email: params.email,
      phone: params.phone,
      subject: params.subject,
      message: params.message,
    );
  }
}

/// Parameters for the [SubmitContact] use case.
class ContactParams extends Equatable {
  final String name;
  final String email;
  final String? phone;
  final String subject;
  final String message;

  const ContactParams({
    required this.name,
    required this.email,
    this.phone,
    required this.subject,
    required this.message,
  });

  @override
  List<Object?> get props => [name, email, phone, subject, message];
}
