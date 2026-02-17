import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/contact/domain/repositories/contact_repository.dart';
import 'package:metzudat_halikud/features/contact/domain/usecases/submit_contact.dart';

class MockContactRepository extends Mock implements ContactRepository {}

void main() {
  late SubmitContact useCase;
  late MockContactRepository mockRepository;

  setUp(() {
    mockRepository = MockContactRepository();
    useCase = SubmitContact(mockRepository);
  });

  const tServerFailure = ServerFailure(message: 'Server error');
  const tName = 'John Doe';
  const tEmail = 'john@example.com';
  const tPhone = '050-1234567';
  const tSubject = 'General Inquiry';
  const tMessage = 'Hello, I have a question.';

  group('SubmitContact', () {
    test('should delegate to repository.submitContact(...)', () async {
      // arrange
      when(() => mockRepository.submitContact(
            name: tName,
            email: tEmail,
            phone: tPhone,
            subject: tSubject,
            message: tMessage,
          )).thenAnswer((_) async => const Right(null));

      // act
      await useCase(const ContactParams(
        name: tName,
        email: tEmail,
        phone: tPhone,
        subject: tSubject,
        message: tMessage,
      ));

      // assert
      verify(() => mockRepository.submitContact(
            name: tName,
            email: tEmail,
            phone: tPhone,
            subject: tSubject,
            message: tMessage,
          )).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(null) on success', () async {
      // arrange
      when(() => mockRepository.submitContact(
            name: tName,
            email: tEmail,
            phone: tPhone,
            subject: tSubject,
            message: tMessage,
          )).thenAnswer((_) async => const Right(null));

      // act
      final result = await useCase(const ContactParams(
        name: tName,
        email: tEmail,
        phone: tPhone,
        subject: tSubject,
        message: tMessage,
      ));

      // assert
      expect(result, const Right(null));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.submitContact(
            name: tName,
            email: tEmail,
            phone: tPhone,
            subject: tSubject,
            message: tMessage,
          )).thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const ContactParams(
        name: tName,
        email: tEmail,
        phone: tPhone,
        subject: tSubject,
        message: tMessage,
      ));

      // assert
      expect(result, const Left(tServerFailure));
    });

    test('should handle null phone parameter', () async {
      // arrange
      when(() => mockRepository.submitContact(
            name: tName,
            email: tEmail,
            phone: null,
            subject: tSubject,
            message: tMessage,
          )).thenAnswer((_) async => const Right(null));

      // act
      final result = await useCase(const ContactParams(
        name: tName,
        email: tEmail,
        subject: tSubject,
        message: tMessage,
      ));

      // assert
      expect(result, const Right(null));
      verify(() => mockRepository.submitContact(
            name: tName,
            email: tEmail,
            phone: null,
            subject: tSubject,
            message: tMessage,
          )).called(1);
    });
  });

  group('ContactParams', () {
    test('should support value equality', () {
      // arrange
      const params1 = ContactParams(
        name: tName,
        email: tEmail,
        phone: tPhone,
        subject: tSubject,
        message: tMessage,
      );
      const params2 = ContactParams(
        name: tName,
        email: tEmail,
        phone: tPhone,
        subject: tSubject,
        message: tMessage,
      );

      // assert
      expect(params1, equals(params2));
    });

    test('should not be equal when any field differs', () {
      // arrange
      const params1 = ContactParams(
        name: tName,
        email: tEmail,
        phone: tPhone,
        subject: tSubject,
        message: tMessage,
      );
      const params2 = ContactParams(
        name: 'Other Name',
        email: tEmail,
        phone: tPhone,
        subject: tSubject,
        message: tMessage,
      );

      // assert
      expect(params1, isNot(equals(params2)));
    });

    test('props should contain name, email, phone, subject, message', () {
      // arrange
      const params = ContactParams(
        name: tName,
        email: tEmail,
        phone: tPhone,
        subject: tSubject,
        message: tMessage,
      );

      // assert
      expect(params.props, [tName, tEmail, tPhone, tSubject, tMessage]);
    });
  });
}
