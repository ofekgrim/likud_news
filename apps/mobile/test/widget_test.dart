import 'package:flutter_test/flutter_test.dart';

import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/home/domain/entities/category.dart';
import 'package:metzudat_halikud/features/home/domain/entities/ticker_item.dart';

/// Smoke test: verifies core entities can be instantiated.
void main() {
  group('Core entities smoke test', () {
    test('Article can be created with required fields', () {
      const article = Article(id: 1, title: 'Test Article');
      expect(article.id, 1);
      expect(article.title, 'Test Article');
      expect(article.hashtags, isEmpty);
      expect(article.isHero, false);
    });

    test('Category can be created with required fields', () {
      const category = Category(id: 1, name: 'Politics');
      expect(category.id, 1);
      expect(category.name, 'Politics');
      expect(category.isActive, true);
    });

    test('TickerItem can be created with required fields', () {
      const ticker = TickerItem(id: 1, text: 'Breaking news');
      expect(ticker.id, 1);
      expect(ticker.text, 'Breaking news');
      expect(ticker.isActive, true);
    });
  });
}
