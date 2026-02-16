import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/member.dart';
import '../repositories/members_repository.dart';

/// Fetches the list of all members.
@injectable
class GetMembers implements UseCase<List<Member>, NoParams> {
  final MembersRepository repository;

  GetMembers(this.repository);

  @override
  Future<Either<Failure, List<Member>>> call(NoParams params) {
    return repository.getMembers();
  }
}
