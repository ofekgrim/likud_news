import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/home/domain/entities/category.dart';

import '../../../../helpers/test_fixtures.dart';

void main() {
  group('Category', () {
    group('equality', () {
      test('two categories with the same properties should be equal', () {
        final category1 = createTestCategory();
        final category2 = createTestCategory();

        expect(category1, equals(category2));
      });

      test('two categories with different id should not be equal', () {
        final category1 = createTestCategory(id: 1);
        final category2 = createTestCategory(id: 2);

        expect(category1, isNot(equals(category2)));
      });

      test('two categories with different name should not be equal', () {
        final category1 = createTestCategory(name: 'Politics');
        final category2 = createTestCategory(name: 'Economy');

        expect(category1, isNot(equals(category2)));
      });

      test('two categories with different isActive should not be equal', () {
        final category1 = createTestCategory(isActive: true);
        final category2 = createTestCategory(isActive: false);

        expect(category1, isNot(equals(category2)));
      });
    });

    group('props', () {
      test('props list should contain all fields', () {
        const category = Category(
          id: 3,
          name: 'Politics',
          nameEn: 'Politics EN',
          slug: 'politics',
          iconUrl: 'https://example.com/icon.svg',
          sortOrder: 2,
          isActive: true,
          color: '#0099DB',
        );

        expect(category.props, [
          3,
          'Politics',
          'Politics EN',
          'politics',
          'https://example.com/icon.svg',
          2,
          true,
          '#0099DB',
        ]);
      });
    });

    group('default values', () {
      test('sortOrder should default to 0', () {
        const category = Category(id: 1, name: 'Test');

        expect(category.sortOrder, equals(0));
      });

      test('isActive should default to true', () {
        const category = Category(id: 1, name: 'Test');

        expect(category.isActive, isTrue);
      });

      test('nullable fields should default to null', () {
        const category = Category(id: 1, name: 'Test');

        expect(category.nameEn, isNull);
        expect(category.slug, isNull);
        expect(category.iconUrl, isNull);
        expect(category.color, isNull);
      });
    });
  });
}
