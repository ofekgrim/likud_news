import 'package:easy_localization/easy_localization.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../domain/usecases/submit_contact.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all contact events.
sealed class ContactEvent extends Equatable {
  const ContactEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers submission of the contact form.
class SubmitContactForm extends ContactEvent {
  final String name;
  final String email;
  final String? phone;
  final String subject;
  final String message;

  const SubmitContactForm({
    required this.name,
    required this.email,
    this.phone,
    required this.subject,
    required this.message,
  });

  @override
  List<Object?> get props => [name, email, phone, subject, message];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all contact states.
sealed class ContactState extends Equatable {
  const ContactState();

  @override
  List<Object?> get props => [];
}

/// Initial state — form ready for input.
class ContactInitial extends ContactState {
  const ContactInitial();
}

/// Form is being submitted to the server.
class ContactSubmitting extends ContactState {
  const ContactSubmitting();
}

/// Form submitted successfully.
class ContactSuccess extends ContactState {
  const ContactSuccess();
}

/// An error occurred during submission.
class ContactError extends ContactState {
  final String message;

  const ContactError(this.message);

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state for the Contact form screen.
///
/// On [SubmitContactForm]:
///   Validates and submits the contact form via the [SubmitContact] use case.
@injectable
class ContactBloc extends Bloc<ContactEvent, ContactState> {
  final SubmitContact _submitContact;

  ContactBloc(this._submitContact) : super(const ContactInitial()) {
    on<SubmitContactForm>(_onSubmitContact);
  }

  Future<void> _onSubmitContact(
    SubmitContactForm event,
    Emitter<ContactState> emit,
  ) async {
    emit(const ContactSubmitting());

    final result = await _submitContact(ContactParams(
      name: event.name,
      email: event.email,
      phone: event.phone,
      subject: event.subject,
      message: event.message,
    ));

    result.fold(
      (failure) => emit(ContactError(
        failure.message ?? 'error_sending_message'.tr(),
      )),
      (_) => emit(const ContactSuccess()),
    );
  }
}
