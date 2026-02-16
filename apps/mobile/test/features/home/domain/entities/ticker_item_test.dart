import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/home/domain/entities/ticker_item.dart';

import '../../../../helpers/test_fixtures.dart';

void main() {
  group('TickerItem', () {
    group('equality', () {
      test('two ticker items with the same properties should be equal', () {
        final ticker1 = createTestTickerItem();
        final ticker2 = createTestTickerItem();

        expect(ticker1, equals(ticker2));
      });

      test('two ticker items with different id should not be equal', () {
        final ticker1 = createTestTickerItem(id: 1);
        final ticker2 = createTestTickerItem(id: 2);

        expect(ticker1, isNot(equals(ticker2)));
      });

      test('two ticker items with different text should not be equal', () {
        final ticker1 = createTestTickerItem(text: 'Breaking: Event A');
        final ticker2 = createTestTickerItem(text: 'Breaking: Event B');

        expect(ticker1, isNot(equals(ticker2)));
      });

      test('two ticker items with different position should not be equal', () {
        final ticker1 = createTestTickerItem(position: 0);
        final ticker2 = createTestTickerItem(position: 5);

        expect(ticker1, isNot(equals(ticker2)));
      });

      test('two ticker items with different isActive should not be equal', () {
        final ticker1 = createTestTickerItem(isActive: true);
        final ticker2 = createTestTickerItem(isActive: false);

        expect(ticker1, isNot(equals(ticker2)));
      });
    });

    group('props', () {
      test('props list should contain all fields', () {
        const ticker = TickerItem(
          id: 7,
          text: 'Major headline',
          linkUrl: 'https://example.com/news',
          articleId: 42,
          position: 3,
          isActive: true,
        );

        expect(ticker.props, [
          7,
          'Major headline',
          'https://example.com/news',
          42,
          3,
          true,
        ]);
      });
    });

    group('default values', () {
      test('position should default to 0', () {
        const ticker = TickerItem(id: 1, text: 'Test');

        expect(ticker.position, equals(0));
      });

      test('isActive should default to true', () {
        const ticker = TickerItem(id: 1, text: 'Test');

        expect(ticker.isActive, isTrue);
      });

      test('nullable fields should default to null', () {
        const ticker = TickerItem(id: 1, text: 'Test');

        expect(ticker.linkUrl, isNull);
        expect(ticker.articleId, isNull);
      });
    });
  });
}
