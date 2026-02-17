import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/members/domain/entities/member.dart';
import 'package:metzudat_halikud/features/members/domain/entities/member_detail.dart';
import 'package:metzudat_halikud/features/members/domain/repositories/members_repository.dart';
import 'package:metzudat_halikud/features/members/domain/usecases/get_member_detail.dart';

class MockMembersRepository extends Mock implements MembersRepository {}

void main() {
  late GetMemberDetail useCase;
  late MockMembersRepository mockRepository;

  setUp(() {
    mockRepository = MockMembersRepository();
    useCase = GetMemberDetail(mockRepository);
  });

  const tMemberDetail = MemberDetail(
    member: Member(id: '1', name: 'Test Member'),
  );

  const tServerFailure = ServerFailure(message: 'Server error');

  group('GetMemberDetail', () {
    test('should delegate to repository.getMemberDetail with correct id',
        () async {
      // arrange
      when(() => mockRepository.getMemberDetail('1'))
          .thenAnswer((_) async => const Right(tMemberDetail));

      // act
      await useCase(const MemberDetailParams(id: '1'));

      // assert
      verify(() => mockRepository.getMemberDetail('1')).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(MemberDetail) on success', () async {
      // arrange
      when(() => mockRepository.getMemberDetail('1'))
          .thenAnswer((_) async => const Right(tMemberDetail));

      // act
      final result = await useCase(const MemberDetailParams(id: '1'));

      // assert
      expect(result, const Right(tMemberDetail));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.getMemberDetail('1'))
          .thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const MemberDetailParams(id: '1'));

      // assert
      expect(result, const Left(tServerFailure));
    });
  });

  group('MemberDetailParams', () {
    test('should support value equality', () {
      // arrange
      const params1 = MemberDetailParams(id: '1');
      const params2 = MemberDetailParams(id: '1');

      // assert
      expect(params1, equals(params2));
    });

    test('should not be equal when id differs', () {
      // arrange
      const params1 = MemberDetailParams(id: '1');
      const params2 = MemberDetailParams(id: '2');

      // assert
      expect(params1, isNot(equals(params2)));
    });

    test('props should contain id', () {
      // arrange
      const params = MemberDetailParams(id: '42');

      // assert
      expect(params.props, ['42']);
    });
  });
}
