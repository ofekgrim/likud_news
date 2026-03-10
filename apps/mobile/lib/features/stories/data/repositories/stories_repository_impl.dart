import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../../home/domain/entities/story.dart';
import '../../domain/repositories/stories_repository.dart';
import '../datasources/stories_remote_datasource.dart';

@LazySingleton(as: StoriesRepository)
class StoriesRepositoryImpl implements StoriesRepository {
  final StoriesRemoteDatasource _remoteDatasource;

  StoriesRepositoryImpl(this._remoteDatasource);

  @override
  Future<Either<Failure, List<Story>>> getStories() async {
    try {
      final models = await _remoteDatasource.getStories();
      return Right(models.map((m) => m.toEntity()).toList());
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
