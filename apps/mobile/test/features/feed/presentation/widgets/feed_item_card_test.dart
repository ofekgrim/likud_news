import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/features/feed/presentation/widgets/feed_item_card.dart';
import 'package:metzudat_halikud/features/feed/presentation/widgets/feed_article_card.dart';
import 'package:metzudat_halikud/features/feed/presentation/widgets/feed_event_card.dart';
import 'package:metzudat_halikud/features/feed/presentation/widgets/feed_election_card.dart';
import 'package:metzudat_halikud/features/feed/presentation/widgets/feed_quiz_prompt_card.dart';
import 'package:metzudat_halikud/features/feed/presentation/widgets/feed_poll_card.dart';
import 'package:metzudat_halikud/features/community_polls/presentation/bloc/polls_bloc.dart';

import '../../../../helpers/mock_blocs.dart';
import '../../../../helpers/test_fixtures.dart';
import '../../../../helpers/widget_test_helpers.dart';

void main() {
  late MockPollsBloc mockPollsBloc;

  setUp(() {
    mockPollsBloc = MockPollsBloc();
    when(() => mockPollsBloc.state).thenReturn(const PollsInitial());
  });

  group('FeedItemCard', () {
    testWidgets('renders FeedArticleCard for ArticleFeedItem', (tester) async {
      final feedItem = createTestArticleFeedItem();

      await pumpTestWidget(
        tester,
        SingleChildScrollView(child: FeedItemCard(feedItem: feedItem)),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byType(FeedArticleCard), findsOneWidget);
    });

    testWidgets('renders FeedPollCard for PollFeedItem', (tester) async {
      final feedItem = createTestPollFeedItem();

      await pumpTestWidget(
        tester,
        SingleChildScrollView(child: FeedItemCard(feedItem: feedItem)),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byType(FeedPollCard), findsOneWidget);
    });

    testWidgets('renders FeedEventCard for EventFeedItem', (tester) async {
      final feedItem = createTestEventFeedItem();

      await pumpTestWidget(
        tester,
        SingleChildScrollView(child: FeedItemCard(feedItem: feedItem)),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byType(FeedEventCard), findsOneWidget);
    });

    testWidgets('renders FeedElectionCard for ElectionUpdateFeedItem',
        (tester) async {
      final feedItem = createTestElectionFeedItem();

      await pumpTestWidget(
        tester,
        SingleChildScrollView(child: FeedItemCard(feedItem: feedItem)),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byType(FeedElectionCard), findsOneWidget);
    });

    testWidgets('renders FeedQuizPromptCard for QuizPromptFeedItem',
        (tester) async {
      final feedItem = createTestQuizFeedItem();

      await pumpTestWidget(
        tester,
        SingleChildScrollView(child: FeedItemCard(feedItem: feedItem)),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byType(FeedQuizPromptCard), findsOneWidget);
    });
  });
}
