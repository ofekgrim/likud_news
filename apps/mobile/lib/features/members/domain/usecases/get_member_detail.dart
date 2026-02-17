import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/member_detail.dart';
import '../repositories/members_repository.dart';

/// Fetches the full detail for a single member, including related articles.
@injectable
class GetMemberDetail implements UseCase<MemberDetail, MemberDetailParams> {
  final MembersRepository repository;

  GetMemberDetail(this.repository);

  @override
  Future<Either<Failure, MemberDetail>> call(MemberDetailParams params) {
    return repository.getMemberDetail(params.id);
  }
}

/// Parameters for the [GetMemberDetail] use case.
class MemberDetailParams extends Equatable {
  final String id;

  const MemberDetailParams({required this.id});

  @override
  List<Object?> get props => [id];
}
