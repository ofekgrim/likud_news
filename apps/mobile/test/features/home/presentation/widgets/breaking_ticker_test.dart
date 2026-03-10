import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/home/domain/entities/ticker_item.dart';
import 'package:metzudat_halikud/features/home/presentation/widgets/breaking_ticker.dart';

import '../../../../helpers/test_fixtures.dart';
import '../../../../helpers/widget_test_helpers.dart';

void main() {
  group('BreakingTicker', () {
    testWidgets('renders nothing when items list is empty', (tester) async {
      await pumpTestWidget(
        tester,
        const BreakingTicker(items: []),
      );

      expect(find.byType(SizedBox), findsWidgets);
      expect(find.text('מבזק'), findsNothing);
    });

    testWidgets('renders מבזק badge text', (tester) async {
      final items = [createTestTickerItem(text: 'Breaking headline')];

      await pumpTestWidget(
        tester,
        BreakingTicker(items: items),
      );

      expect(find.text('מבזק'), findsOneWidget);
    });

    testWidgets('renders bolt icon', (tester) async {
      final items = [createTestTickerItem(text: 'Headline')];

      await pumpTestWidget(
        tester,
        BreakingTicker(items: items),
      );

      expect(find.byIcon(Icons.bolt), findsOneWidget);
    });

    testWidgets('renders ticker item text', (tester) async {
      final items = [
        createTestTickerItem(id: '1', text: 'First headline'),
        createTestTickerItem(id: '2', text: 'Second headline'),
      ];

      await pumpTestWidget(
        tester,
        BreakingTicker(items: items),
      );

      expect(find.text('First headline'), findsOneWidget);
      expect(find.text('Second headline'), findsOneWidget);
    });

    testWidgets('renders bullet separators between items', (tester) async {
      final items = [
        createTestTickerItem(id: '1', text: 'A'),
        createTestTickerItem(id: '2', text: 'B'),
      ];

      await pumpTestWidget(
        tester,
        BreakingTicker(items: items),
      );

      expect(find.text('\u2022'), findsOneWidget);
    });

    testWidgets('has height of 36', (tester) async {
      final items = [createTestTickerItem(text: 'Test')];

      await pumpTestWidget(
        tester,
        BreakingTicker(items: items),
      );

      // The parent Container has height: 36
      final parentContainer = tester.widgetList<Container>(
        find.byType(Container),
      ).where((c) => c.constraints?.maxHeight == 36);
      expect(parentContainer, isNotEmpty);
    });

    testWidgets('triggers onItemTap when ticker item is tapped',
        (tester) async {
      TickerItem? tappedItem;
      final items = [createTestTickerItem(text: 'Tappable headline')];

      await pumpTestWidget(
        tester,
        BreakingTicker(
          items: items,
          onItemTap: (item) => tappedItem = item,
        ),
      );

      await tester.tap(find.text('Tappable headline'));
      expect(tappedItem, isNotNull);
      expect(tappedItem!.text, 'Tappable headline');
    });
  });
}
