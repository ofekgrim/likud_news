import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/categories/presentation/widgets/category_card.dart';

import '../../../../helpers/test_fixtures.dart';
import '../../../../helpers/widget_test_helpers.dart';

void main() {
  group('CategoryCard', () {
    testWidgets('renders category name', (tester) async {
      final category = createTestCategory(name: 'פוליטיקה');

      await pumpTestWidget(
        tester,
        CategoryCard(category: category),
      );

      expect(find.text('פוליטיקה'), findsOneWidget);
    });

    testWidgets('renders folder icon when no iconUrl', (tester) async {
      final category = createTestCategory(iconUrl: null);

      await pumpTestWidget(
        tester,
        CategoryCard(category: category),
      );

      expect(find.byIcon(Icons.folder_outlined), findsOneWidget);
    });

    testWidgets('renders folder icon when iconUrl is empty', (tester) async {
      final category = createTestCategory(iconUrl: '');

      await pumpTestWidget(
        tester,
        CategoryCard(category: category),
      );

      expect(find.byIcon(Icons.folder_outlined), findsOneWidget);
    });

    testWidgets('renders accent color bar', (tester) async {
      final category = createTestCategory(color: '#10B981');

      await pumpTestWidget(
        tester,
        CategoryCard(category: category),
      );

      // The accent bar is a Container with width: 40, height: 4
      final containers = tester.widgetList<Container>(find.byType(Container));
      final accentBar = containers.where((c) {
        final constraints = c.constraints;
        return constraints != null &&
            constraints.maxWidth == 40 &&
            constraints.maxHeight == 4;
      });
      expect(accentBar, isNotEmpty);
    });

    testWidgets('triggers onTap callback', (tester) async {
      var tapped = false;
      final category = createTestCategory();

      await pumpTestWidget(
        tester,
        CategoryCard(
          category: category,
          onTap: () => tapped = true,
        ),
      );

      await tester.tap(find.byType(GestureDetector).first);
      expect(tapped, isTrue);
    });

    testWidgets('renders category name with ellipsis overflow',
        (tester) async {
      final category = createTestCategory(name: 'Very Long Category Name');

      await pumpTestWidget(
        tester,
        CategoryCard(category: category),
      );

      final text = tester.widget<Text>(find.text('Very Long Category Name'));
      expect(text.maxLines, 1);
      expect(text.overflow, TextOverflow.ellipsis);
    });
  });
}
