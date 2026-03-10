import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/feed/presentation/widgets/feed_article_card.dart';

import '../../../../helpers/test_fixtures.dart';
import '../../../../helpers/widget_test_helpers.dart';

void main() {
  group('FeedArticleCard', () {
    testWidgets('renders article title', (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Likud Wins Big in Polls',
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(article: article),
        ),
      );

      expect(find.text('Likud Wins Big in Polls'), findsOneWidget);
    });

    testWidgets('renders subtitle when provided', (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Main Title',
        subtitle: 'This is the subtitle text',
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(article: article),
        ),
      );

      expect(find.text('This is the subtitle text'), findsOneWidget);
    });

    testWidgets('does not render subtitle when null', (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Main Title',
        subtitle: null,
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(article: article),
        ),
      );

      // Title should be there
      expect(find.text('Main Title'), findsOneWidget);
      // No subtitle text widget beyond title, category, author, etc.
      // Verify that the subtitle Text widget is not rendered
      // Since subtitle is null, the widget tree should not contain it
      final textWidgets = tester.widgetList<Text>(find.byType(Text));
      final subtitleTexts = textWidgets.where(
        (t) => t.style?.fontSize == 14 && t.style?.height == 1.4,
      );
      expect(subtitleTexts.isEmpty, isTrue);
    });

    testWidgets('renders category badge', (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Title',
        categoryName: 'Politics',
        categoryColor: '#0099DB',
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(article: article),
        ),
      );

      expect(find.text('Politics'), findsOneWidget);
    });

    testWidgets('does not show category when null', (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Title',
        categoryName: null,
        categoryColor: null,
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(article: article),
        ),
      );

      // The title should exist
      expect(find.text('Title'), findsOneWidget);
      // No category badge text should be rendered
      // We verify by checking that no text matching common category names appears
      // More specifically, there should be no Container with the category styling
      // Since categoryName is null, the category Container is not built at all
      final textWidgets = tester.widgetList<Text>(find.byType(Text));
      final categoryTexts = textWidgets.where(
        (t) => t.style?.fontSize == 11 && t.style?.fontWeight == FontWeight.w600,
      );
      expect(categoryTexts.isEmpty, isTrue);
    });

    testWidgets('renders author name with person icon', (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Title',
        author: 'Yossi Cohen',
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(article: article),
        ),
      );

      expect(find.text('Yossi Cohen'), findsOneWidget);
      expect(find.byIcon(Icons.person_outline), findsOneWidget);
    });

    testWidgets('renders view count', (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Title',
        viewCount: 42,
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(article: article),
        ),
      );

      expect(find.text('42'), findsOneWidget);
      expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);
    });

    testWidgets('renders comment count', (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Title',
        commentCount: 17,
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(article: article),
        ),
      );

      expect(find.text('17'), findsOneWidget);
      expect(find.byIcon(Icons.comment_outlined), findsOneWidget);
    });

    testWidgets('shows breaking badge when isBreaking is true', (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Breaking Story',
        isBreaking: true,
        heroImageUrl: 'https://example.com/image.jpg',
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(article: article),
        ),
      );

      expect(find.byIcon(Icons.flash_on), findsOneWidget);
    });

    testWidgets('hides breaking badge when isBreaking is false',
        (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Normal Story',
        isBreaking: false,
        heroImageUrl: 'https://example.com/image.jpg',
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(article: article),
        ),
      );

      expect(find.byIcon(Icons.flash_on), findsNothing);
    });

    testWidgets('shows pinned icon when isPinned is true', (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Pinned Article',
        heroImageUrl: 'https://example.com/image.jpg',
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(
            article: article,
            isPinned: true,
          ),
        ),
      );

      expect(find.byIcon(Icons.push_pin), findsOneWidget);
    });

    testWidgets('triggers onTap callback when tapped', (tester) async {
      var tapped = false;
      final article = createTestFeedArticleContent(
        title: 'Tappable Article',
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(
            article: article,
            onTap: () => tapped = true,
          ),
        ),
      );

      await tester.tap(find.byType(FeedArticleCard));
      await tester.pump();

      expect(tapped, isTrue);
    });

    testWidgets('formats view count as K when >= 1000', (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Popular Article',
        viewCount: 2500,
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(article: article),
        ),
      );

      expect(find.text('2.5K'), findsOneWidget);
      expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);
    });

    testWidgets('formats view count as M when >= 1000000', (tester) async {
      final article = createTestFeedArticleContent(
        title: 'Viral Article',
        viewCount: 1500000,
      );

      await pumpTestWidget(
        tester,
        SingleChildScrollView(
          child: FeedArticleCard(article: article),
        ),
      );

      expect(find.text('1.5M'), findsOneWidget);
      expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);
    });
  });
}
