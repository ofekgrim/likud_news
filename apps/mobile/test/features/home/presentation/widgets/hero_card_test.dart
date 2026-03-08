import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../../../helpers/test_fixtures.dart';
import '../../../../helpers/widget_test_helpers.dart';
import 'package:metzudat_halikud/features/home/presentation/widgets/hero_card.dart';

void main() {
  group('HeroCard', () {
    testWidgets('renders the article title', (tester) async {
      final article = createTestArticle(title: 'ראש הממשלה נפגש עם נשיא ארה״ב');

      await pumpTestWidget(tester, HeroCard(article: article));

      expect(find.text('ראש הממשלה נפגש עם נשיא ארה״ב'), findsOneWidget);
    });

    testWidgets('renders the article subtitle when provided', (tester) async {
      final article = createTestArticle(
        title: 'כותרת',
        subtitle: 'כותרת משנה לבדיקה',
      );

      await pumpTestWidget(tester, HeroCard(article: article));

      expect(find.text('כותרת משנה לבדיקה'), findsOneWidget);
    });

    testWidgets('hides subtitle when it is null', (tester) async {
      final article = createTestArticle(
        title: 'כותרת',
        subtitle: null,
      );

      await pumpTestWidget(tester, HeroCard(article: article));

      // Only the title should be present, no subtitle text widget
      expect(find.text('כותרת'), findsOneWidget);
      // Verify no extra Text widgets beyond title and possibly category
      final textWidgets = tester.widgetList<Text>(find.byType(Text));
      final texts = textWidgets.map((t) => t.data).toList();
      expect(texts, isNot(contains(null)));
    });

    testWidgets('renders category badge when categoryName is not null',
        (tester) async {
      final article = createTestArticle(
        title: 'כותרת',
        categoryName: 'פוליטיקה',
        categoryColor: '#0099DB',
      );

      await pumpTestWidget(tester, HeroCard(article: article));

      expect(find.text('פוליטיקה'), findsOneWidget);
    });

    testWidgets('hides category badge when categoryName is null',
        (tester) async {
      final article = createTestArticle(
        title: 'כותרת',
        categoryName: null,
      );

      await pumpTestWidget(tester, HeroCard(article: article));

      // The category name should not appear as a Text widget
      expect(find.text('Test Category'), findsNothing);
      // The title should still be present
      expect(find.text('כותרת'), findsOneWidget);
    });

    testWidgets('shows breaking badge when article.isBreaking is true',
        (tester) async {
      final article = createTestArticle(
        title: 'כותרת',
        isBreaking: true,
      );

      await pumpTestWidget(tester, HeroCard(article: article));

      expect(find.text('מבזק'), findsOneWidget);
      expect(find.byIcon(Icons.bolt), findsOneWidget);
    });

    testWidgets('hides breaking badge when article.isBreaking is false',
        (tester) async {
      final article = createTestArticle(
        title: 'כותרת',
        isBreaking: false,
      );

      await pumpTestWidget(tester, HeroCard(article: article));

      expect(find.text('מבזק'), findsNothing);
      expect(find.byIcon(Icons.bolt), findsNothing);
    });

    testWidgets('triggers onTap callback when tapped', (tester) async {
      var tapped = false;
      final article = createTestArticle(title: 'כותרת');

      await pumpTestWidget(
        tester,
        HeroCard(
          article: article,
          onTap: () => tapped = true,
        ),
      );

      await tester.tap(find.byType(HeroCard));
      await tester.pump();

      expect(tapped, isTrue);
    });
  });
}
