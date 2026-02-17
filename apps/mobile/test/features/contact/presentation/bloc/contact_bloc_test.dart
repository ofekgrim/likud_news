import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/contact/domain/usecases/submit_contact.dart';
import 'package:metzudat_halikud/features/contact/presentation/bloc/contact_bloc.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockSubmitContact extends Mock implements SubmitContact {}

void main() {
  late ContactBloc bloc;
  late MockSubmitContact mockSubmitContact;

  // -------------------------------------------------------------------------
  // Test data
  // -------------------------------------------------------------------------

  const tServerFailure = ServerFailure(message: 'Server error');

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  setUpAll(() {
    registerFallbackValue(const ContactParams(
      name: '',
      email: '',
      subject: '',
      message: '',
    ));
  });

  setUp(() {
    mockSubmitContact = MockSubmitContact();
    bloc = ContactBloc(mockSubmitContact);
  });

  tearDown(() {
    bloc.close();
  });

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------

  group('ContactBloc', () {
    test('initial state is ContactInitial', () {
      expect(bloc.state, const ContactInitial());
    });

    // -----------------------------------------------------------------------
    // SubmitContactForm
    // -----------------------------------------------------------------------

    group('SubmitContactForm', () {
      blocTest<ContactBloc, ContactState>(
        'emits [ContactSubmitting, ContactSuccess] on success',
        build: () {
          when(() => mockSubmitContact(any()))
              .thenAnswer((_) async => const Right(null));
          return bloc;
        },
        act: (bloc) => bloc.add(const SubmitContactForm(
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'Test message body',
        )),
        expect: () => [
          const ContactSubmitting(),
          const ContactSuccess(),
        ],
        verify: (_) {
          verify(() => mockSubmitContact(any())).called(1);
        },
      );

      blocTest<ContactBloc, ContactState>(
        'emits [ContactSubmitting, ContactError] on failure',
        build: () {
          when(() => mockSubmitContact(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const SubmitContactForm(
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'Test message body',
        )),
        expect: () => [
          const ContactSubmitting(),
          const ContactError('Server error'),
        ],
      );

      blocTest<ContactBloc, ContactState>(
        'passes correct params including phone to use case',
        build: () {
          when(() => mockSubmitContact(any()))
              .thenAnswer((_) async => const Right(null));
          return bloc;
        },
        act: (bloc) => bloc.add(const SubmitContactForm(
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+972-50-1234567',
          subject: 'Feedback',
          message: 'Great app!',
        )),
        verify: (_) {
          verify(() => mockSubmitContact(const ContactParams(
                name: 'Jane Doe',
                email: 'jane@example.com',
                phone: '+972-50-1234567',
                subject: 'Feedback',
                message: 'Great app!',
              ))).called(1);
        },
      );

      blocTest<ContactBloc, ContactState>(
        'handles null phone correctly',
        build: () {
          when(() => mockSubmitContact(any()))
              .thenAnswer((_) async => const Right(null));
          return bloc;
        },
        act: (bloc) => bloc.add(const SubmitContactForm(
          name: 'No Phone',
          email: 'nophone@example.com',
          subject: 'Question',
          message: 'No phone provided',
        )),
        verify: (_) {
          verify(() => mockSubmitContact(const ContactParams(
                name: 'No Phone',
                email: 'nophone@example.com',
                phone: null,
                subject: 'Question',
                message: 'No phone provided',
              ))).called(1);
        },
      );

      blocTest<ContactBloc, ContactState>(
        'emits [ContactSubmitting, ContactSuccess] with all fields populated',
        build: () {
          when(() => mockSubmitContact(any()))
              .thenAnswer((_) async => const Right(null));
          return bloc;
        },
        act: (bloc) => bloc.add(const SubmitContactForm(
          name: 'Full Contact',
          email: 'full@example.com',
          phone: '054-9876543',
          subject: 'Full Form',
          message: 'All fields filled in this message',
        )),
        expect: () => [
          const ContactSubmitting(),
          const ContactSuccess(),
        ],
      );
    });
  });
}
