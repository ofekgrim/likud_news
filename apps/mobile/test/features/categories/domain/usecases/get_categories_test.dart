import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/core/usecases/usecase.dart';
import 'package:metzudat_halikud/features/home/domain/entities/category.dart';
import 'package:metzudat_halikud/features/categories/domain/repositories/categories_repository.dart';
import 'package:metzudat_halikud/features/categories/domain/usecases/get_categories.dart';

class MockCategoriesRepository extends Mock implements CategoriesRepository {}

void main() {
  late GetCategories useCase;
  late MockCategoriesRepository mockRepository;

  setUp(() {
    mockRepository = MockCategoriesRepository();
    useCase = GetCategories(mockRepository);
  });

  const tCategories = [
    Category(id: '1', name: 'Test'),
    Category(id: '2', name: 'Politics'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');

  group('GetCategories', () {
    test('should delegate to repository.getCategories', () async {
      // arrange
      when(() => mockRepository.getCategories())
          .thenAnswer((_) async => const Right(tCategories));

      // act
      await useCase(const NoParams());

      // assert
      verify(() => mockRepository.getCategories()).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(List<Category>) on success', () async {
      // arrange
      when(() => mockRepository.getCategories())
          .thenAnswer((_) async => const Right(tCategories));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Right(tCategories));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.getCategories())
          .thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Left(tServerFailure));
    });

    test('should call repository exactly once per invocation', () async {
      // arrange
      when(() => mockRepository.getCategories())
          .thenAnswer((_) async => const Right(tCategories));

      // act
      await useCase(const NoParams());
      await useCase(const NoParams());

      // assert
      verify(() => mockRepository.getCategories()).called(2);
    });

    test('should return empty list when repository returns empty list',
        () async {
      // arrange
      when(() => mockRepository.getCategories())
          .thenAnswer((_) async => const Right(<Category>[]));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Right(<Category>[]));
    });
  });
}
