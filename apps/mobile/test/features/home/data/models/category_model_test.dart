import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/home/data/models/category_model.dart';
import 'package:metzudat_halikud/features/home/domain/entities/category.dart';

void main() {
  group('CategoryModel', () {
    final tJson = <String, dynamic>{
      'id': '1',
      'name': '\u05E4\u05D5\u05DC\u05D9\u05D8\u05D9\u05E7\u05D4',
      'nameEn': 'Politics',
      'slug': 'politics',
      'iconUrl': 'https://example.com/icon.svg',
      'sortOrder': 2,
      'isActive': true,
      'color': '#0099DB',
    };

    const tModel = CategoryModel(
      id: '1',
      name: '\u05E4\u05D5\u05DC\u05D9\u05D8\u05D9\u05E7\u05D4',
      nameEn: 'Politics',
      slug: 'politics',
      iconUrl: 'https://example.com/icon.svg',
      sortOrder: 2,
      isActive: true,
      color: '#0099DB',
    );

    group('fromJson', () {
      test('should parse full JSON correctly', () {
        final model = CategoryModel.fromJson(tJson);

        expect(model.id, equals('1'));
        expect(
            model.name,
            equals(
                '\u05E4\u05D5\u05DC\u05D9\u05D8\u05D9\u05E7\u05D4'));
        expect(model.nameEn, equals('Politics'));
        expect(model.slug, equals('politics'));
        expect(model.iconUrl, equals('https://example.com/icon.svg'));
        expect(model.sortOrder, equals(2));
        expect(model.isActive, isTrue);
        expect(model.color, equals('#0099DB'));
      });

      test('should handle defaults for missing optional fields', () {
        final minimalJson = <String, dynamic>{
          'id': '1',
          'name': 'Test',
        };

        final model = CategoryModel.fromJson(minimalJson);

        expect(model.id, equals('1'));
        expect(model.name, equals('Test'));
        expect(model.nameEn, isNull);
        expect(model.slug, isNull);
        expect(model.iconUrl, isNull);
        expect(model.sortOrder, equals(0));
        expect(model.isActive, isTrue);
        expect(model.color, isNull);
      });
    });

    group('toJson', () {
      test('should serialize all fields correctly', () {
        final json = tModel.toJson();

        expect(json['id'], equals('1'));
        expect(
            json['name'],
            equals(
                '\u05E4\u05D5\u05DC\u05D9\u05D8\u05D9\u05E7\u05D4'));
        expect(json['nameEn'], equals('Politics'));
        expect(json['slug'], equals('politics'));
        expect(json['iconUrl'], equals('https://example.com/icon.svg'));
        expect(json['sortOrder'], equals(2));
        expect(json['isActive'], isTrue);
        expect(json['color'], equals('#0099DB'));
      });
    });

    group('toEntity', () {
      test('should return Category with matching fields', () {
        final entity = tModel.toEntity();

        expect(entity, isA<Category>());
        expect(entity.id, equals(tModel.id));
        expect(entity.name, equals(tModel.name));
        expect(entity.nameEn, equals(tModel.nameEn));
        expect(entity.slug, equals(tModel.slug));
        expect(entity.iconUrl, equals(tModel.iconUrl));
        expect(entity.sortOrder, equals(tModel.sortOrder));
        expect(entity.isActive, equals(tModel.isActive));
        expect(entity.color, equals(tModel.color));
      });
    });
  });
}
