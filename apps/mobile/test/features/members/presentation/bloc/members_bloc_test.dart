import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/core/usecases/usecase.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/members/domain/entities/member.dart';
import 'package:metzudat_halikud/features/members/domain/entities/member_detail.dart';
import 'package:metzudat_halikud/features/members/domain/usecases/get_member_detail.dart';
import 'package:metzudat_halikud/features/members/domain/usecases/get_members.dart';
import 'package:metzudat_halikud/features/members/presentation/bloc/members_bloc.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockGetMembers extends Mock implements GetMembers {}

class MockGetMemberDetail extends Mock implements GetMemberDetail {}

void main() {
  late MembersBloc bloc;
  late MockGetMembers mockGetMembers;
  late MockGetMemberDetail mockGetMemberDetail;

  // -------------------------------------------------------------------------
  // Test data
  // -------------------------------------------------------------------------

  const tMembers = [
    Member(id: '1', name: 'Member 1'),
    Member(id: '2', name: 'Member 2'),
  ];

  const tMemberDetail = MemberDetail(
    member: Member(id: '1', name: 'Member 1'),
    articles: [
      Article(id: 'a1', title: 'Related Article 1'),
      Article(id: 'a2', title: 'Related Article 2'),
    ],
  );

  const tServerFailure = ServerFailure(message: 'Server error');

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  setUpAll(() {
    registerFallbackValue(const NoParams());
    registerFallbackValue(const MemberDetailParams(id: ''));
  });

  setUp(() {
    mockGetMembers = MockGetMembers();
    mockGetMemberDetail = MockGetMemberDetail();
    bloc = MembersBloc(mockGetMembers, mockGetMemberDetail);
  });

  tearDown(() {
    bloc.close();
  });

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------

  group('MembersBloc', () {
    test('initial state is MembersInitial', () {
      expect(bloc.state, const MembersInitial());
    });

    // -----------------------------------------------------------------------
    // LoadMembers
    // -----------------------------------------------------------------------

    group('LoadMembers', () {
      blocTest<MembersBloc, MembersState>(
        'emits [MembersLoading, MembersLoaded] on success',
        build: () {
          when(() => mockGetMembers(any()))
              .thenAnswer((_) async => const Right(tMembers));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMembers()),
        expect: () => [
          const MembersLoading(),
          const MembersLoaded(members: tMembers),
        ],
      );

      blocTest<MembersBloc, MembersState>(
        'emits [MembersLoading, MembersError] on failure',
        build: () {
          when(() => mockGetMembers(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMembers()),
        expect: () => [
          const MembersLoading(),
          const MembersError(message: 'Server error'),
        ],
      );

      blocTest<MembersBloc, MembersState>(
        'calls getMembers exactly once',
        build: () {
          when(() => mockGetMembers(any()))
              .thenAnswer((_) async => const Right(tMembers));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMembers()),
        verify: (_) {
          verify(() => mockGetMembers(any())).called(1);
        },
      );

      blocTest<MembersBloc, MembersState>(
        'passes NoParams to getMembers',
        build: () {
          when(() => mockGetMembers(any()))
              .thenAnswer((_) async => const Right(tMembers));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMembers()),
        verify: (_) {
          verify(() => mockGetMembers(const NoParams())).called(1);
        },
      );

      blocTest<MembersBloc, MembersState>(
        'emits [MembersLoading, MembersError] with default message when failure has no message',
        build: () {
          when(() => mockGetMembers(any()))
              .thenAnswer((_) async => const Left(ServerFailure()));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMembers()),
        expect: () => [
          const MembersLoading(),
          const MembersError(message: 'Failed to load members'),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // LoadMemberDetail
    // -----------------------------------------------------------------------

    group('LoadMemberDetail', () {
      blocTest<MembersBloc, MembersState>(
        'emits [MembersLoading, MemberDetailLoaded] on success',
        build: () {
          when(() => mockGetMemberDetail(any()))
              .thenAnswer((_) async => const Right(tMemberDetail));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMemberDetail(id: '1')),
        expect: () => [
          const MembersLoading(),
          const MemberDetailLoaded(memberDetail: tMemberDetail),
        ],
      );

      blocTest<MembersBloc, MembersState>(
        'emits [MembersLoading, MembersError] on failure',
        build: () {
          when(() => mockGetMemberDetail(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMemberDetail(id: '1')),
        expect: () => [
          const MembersLoading(),
          const MembersError(message: 'Server error'),
        ],
      );

      blocTest<MembersBloc, MembersState>(
        'calls getMemberDetail with correct id',
        build: () {
          when(() => mockGetMemberDetail(any()))
              .thenAnswer((_) async => const Right(tMemberDetail));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMemberDetail(id: '42')),
        verify: (_) {
          verify(
            () => mockGetMemberDetail(const MemberDetailParams(id: '42')),
          ).called(1);
        },
      );

      blocTest<MembersBloc, MembersState>(
        'passes correct params to getMemberDetail',
        build: () {
          when(() => mockGetMemberDetail(any()))
              .thenAnswer((_) async => const Right(tMemberDetail));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMemberDetail(id: 'abc-123')),
        verify: (_) {
          verify(
            () => mockGetMemberDetail(
              const MemberDetailParams(id: 'abc-123'),
            ),
          ).called(1);
        },
      );

      blocTest<MembersBloc, MembersState>(
        'emits [MembersLoading, MembersError] with default message when failure has no message',
        build: () {
          when(() => mockGetMemberDetail(any()))
              .thenAnswer((_) async => const Left(ServerFailure()));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMemberDetail(id: '1')),
        expect: () => [
          const MembersLoading(),
          const MembersError(message: 'Failed to load member details'),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // LoadMembers after LoadMemberDetail
    // -----------------------------------------------------------------------

    group('LoadMembers after LoadMemberDetail', () {
      blocTest<MembersBloc, MembersState>(
        'can re-load members list after viewing a member detail',
        build: () {
          when(() => mockGetMembers(any()))
              .thenAnswer((_) async => const Right(tMembers));
          return bloc;
        },
        seed: () => const MemberDetailLoaded(memberDetail: tMemberDetail),
        act: (bloc) => bloc.add(const LoadMembers()),
        expect: () => [
          const MembersLoading(),
          const MembersLoaded(members: tMembers),
        ],
        verify: (_) {
          verify(() => mockGetMembers(any())).called(1);
        },
      );
    });
  });
}
