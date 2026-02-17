import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/member.dart';
import '../entities/member_detail.dart';

/// Abstract contract for the members feature data operations.
///
/// Implemented by [MembersRepositoryImpl] in the data layer.
abstract class MembersRepository {
  /// Fetches all active members.
  Future<Either<Failure, List<Member>>> getMembers();

  /// Fetches a single member's full profile with related articles.
  Future<Either<Failure, MemberDetail>> getMemberDetail(String id);
}
