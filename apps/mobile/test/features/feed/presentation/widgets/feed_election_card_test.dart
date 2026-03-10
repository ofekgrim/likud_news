import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/feed/presentation/widgets/feed_election_card.dart';
import 'package:metzudat_halikud/features/feed/domain/entities/feed_item.dart';

import '../../../../helpers/test_fixtures.dart';
import '../../../../helpers/widget_test_helpers.dart';

void main() {
  group('FeedElectionCard', () {
    testWidgets('renders LIVE badge with red background when isLive is true',
        (tester) async {
      final electionContent = createTestFeedElectionContent(isLive: true);

      await pumpTestWidget(
        tester,
        FeedElectionCard(electionUpdate: electionContent),
      );

      expect(find.text('live'), findsOneWidget);

      // Find the badge container and verify its red background color
      final badgeContainer = tester.widget<Container>(
        find.ancestor(
          of: find.text('live'),
          matching: find.byType(Container),
        ).first,
      );
      final decoration = badgeContainer.decoration as BoxDecoration;
      expect(decoration.color, const Color(0xFFDC2626)); // breakingRed
    });

    testWidgets('renders FINAL badge with grey background when isLive is false',
        (tester) async {
      final electionContent = createTestFeedElectionContent(isLive: false);

      await pumpTestWidget(
        tester,
        FeedElectionCard(electionUpdate: electionContent),
      );

      expect(find.text('final'), findsOneWidget);

      // Find the badge container and verify grey background
      final badgeContainer = tester.widget<Container>(
        find.ancestor(
          of: find.text('final'),
          matching: find.byType(Container),
        ).first,
      );
      final decoration = badgeContainer.decoration as BoxDecoration;
      expect(decoration.color, Colors.grey);
    });

    testWidgets('renders white pulsing dot inside badge when isLive',
        (tester) async {
      final electionContent = createTestFeedElectionContent(isLive: true);

      await pumpTestWidget(
        tester,
        FeedElectionCard(electionUpdate: electionContent),
      );

      // Find the small 8x8 white dot container inside the badge
      final dotFinder = find.descendant(
        of: find.ancestor(
          of: find.text('live'),
          matching: find.byType(Row),
        ).first,
        matching: find.byWidgetPredicate((widget) {
          if (widget is Container) {
            final decoration = widget.decoration;
            if (decoration is BoxDecoration) {
              return decoration.color == Colors.white &&
                  decoration.shape == BoxShape.circle;
            }
          }
          return false;
        }),
      );

      expect(dotFinder, findsOneWidget);
    });

    testWidgets('does not render white dot when isLive is false',
        (tester) async {
      final electionContent = createTestFeedElectionContent(isLive: false);

      await pumpTestWidget(
        tester,
        FeedElectionCard(electionUpdate: electionContent),
      );

      // The white dot should not be present
      final dotFinder = find.byWidgetPredicate((widget) {
        if (widget is Container) {
          final decoration = widget.decoration;
          if (decoration is BoxDecoration) {
            return decoration.color == Colors.white &&
                decoration.shape == BoxShape.circle;
          }
        }
        return false;
      });

      // Filter to only find dots inside the badge row (not other white circles)
      final badgeRow = find.ancestor(
        of: find.text('final'),
        matching: find.byType(Row),
      ).first;

      final dotsInBadge = find.descendant(
        of: badgeRow,
        matching: dotFinder,
      );

      expect(dotsInBadge, findsNothing);
    });

    testWidgets('renders election name text', (tester) async {
      final electionContent = createTestFeedElectionContent(
        electionName: 'Likud Primaries 2026',
      );

      await pumpTestWidget(
        tester,
        FeedElectionCard(electionUpdate: electionContent),
      );

      expect(find.text('Likud Primaries 2026'), findsOneWidget);
    });

    testWidgets(
        'renders turnout section with how_to_vote icon and percentage',
        (tester) async {
      final electionContent = createTestFeedElectionContent(
        turnoutPercentage: 67.5,
      );

      await pumpTestWidget(
        tester,
        FeedElectionCard(electionUpdate: electionContent),
      );

      expect(find.byIcon(Icons.how_to_vote_outlined), findsOneWidget);
      expect(find.text('67.5%'), findsOneWidget);
    });

    testWidgets('renders voter counts when actualVoters and eligibleVoters provided',
        (tester) async {
      final electionContent = createTestFeedElectionContent(
        actualVoters: 84375,
        eligibleVoters: 125000,
      );

      await pumpTestWidget(
        tester,
        FeedElectionCard(electionUpdate: electionContent),
      );

      // Voter counts are formatted with commas: "84,375 / 125,000 voters"
      expect(find.textContaining('84,375'), findsOneWidget);
      expect(find.textContaining('125,000'), findsOneWidget);
    });

    testWidgets('renders top candidates with names and percentage bars',
        (tester) async {
      final candidates = [
        const FeedCandidateResult(
          id: 'c1',
          name: 'Alice Cohen',
          votesCount: 15000,
          percentage: 40.0,
        ),
        const FeedCandidateResult(
          id: 'c2',
          name: 'Bob Levy',
          votesCount: 12000,
          percentage: 32.0,
        ),
      ];

      final electionContent = createTestFeedElectionContent(
        topCandidates: candidates,
      );

      await pumpTestWidget(
        tester,
        FeedElectionCard(electionUpdate: electionContent),
      );

      // Candidate names
      expect(find.text('Alice Cohen'), findsOneWidget);
      expect(find.text('Bob Levy'), findsOneWidget);

      // Candidate percentages
      expect(find.text('40.0%'), findsOneWidget);
      expect(find.text('32.0%'), findsOneWidget);

      // top_candidates header
      expect(find.text('top_candidates'), findsOneWidget);

      // FractionallySizedBox used for percentage bars
      expect(find.byType(FractionallySizedBox), findsNWidgets(2));
    });

    testWidgets('renders pin icon when isPinned is true', (tester) async {
      final electionContent = createTestFeedElectionContent();

      await pumpTestWidget(
        tester,
        FeedElectionCard(electionUpdate: electionContent, isPinned: true),
      );

      expect(find.byIcon(Icons.push_pin), findsOneWidget);
    });

    testWidgets('does not render pin icon when isPinned is false',
        (tester) async {
      final electionContent = createTestFeedElectionContent();

      await pumpTestWidget(
        tester,
        FeedElectionCard(electionUpdate: electionContent, isPinned: false),
      );

      expect(find.byIcon(Icons.push_pin), findsNothing);
    });

    testWidgets('renders view results button with leaderboard icon',
        (tester) async {
      final electionContent = createTestFeedElectionContent();

      await pumpTestWidget(
        tester,
        FeedElectionCard(electionUpdate: electionContent),
      );

      expect(find.byIcon(Icons.leaderboard), findsOneWidget);
      expect(find.text('view_results'), findsOneWidget);
    });

    testWidgets('invokes onTap callback when view results button is tapped',
        (tester) async {
      bool tapped = false;
      final electionContent = createTestFeedElectionContent();

      await pumpTestWidget(
        tester,
        FeedElectionCard(
          electionUpdate: electionContent,
          onTap: () => tapped = true,
        ),
      );

      await tester.tap(find.byType(TextButton));
      await tester.pump();

      expect(tapped, isTrue);
    });
  });
}
