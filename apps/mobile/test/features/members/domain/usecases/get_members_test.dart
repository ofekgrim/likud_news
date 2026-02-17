import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/core/usecases/usecase.dart';
import 'package:metzudat_halikud/features/members/domain/entities/member.dart';
import 'package:metzudat_halikud/features/members/domain/repositories/members_repository.dart';
import 'package:metzudat_halikud/features/members/domain/usecases/get_members.dart';

class MockMembersRepository extends Mock implements MembersRepository {}

void main() {
  late GetMembers useCase;
  late MockMembersRepository mockRepository;

  setUp(() {
    mockRepository = MockMembersRepository();
    useCase = GetMembers(mockRepository);
  });

  const tMembers = [
    Member(id: '1', name: 'Test Member'),
    Member(id: '2', name: 'Test Member 2'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');

  group('GetMembers', () {
    test('should delegate to repository.getMembers', () async {
      // arrange
      when(() => mockRepository.getMembers())
          .thenAnswer((_) async => const Right(tMembers));

      // act
      await useCase(const NoParams());

      // assert
      verify(() => mockRepository.getMembers()).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(List<Member>) on success', () async {
      // arrange
      when(() => mockRepository.getMembers())
          .thenAnswer((_) async => const Right(tMembers));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Right(tMembers));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.getMembers())
          .thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Left(tServerFailure));
    });
  });
}
