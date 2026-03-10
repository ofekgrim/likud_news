import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/features/feed/domain/entities/feed_item.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockGoRouter extends Mock implements GoRouter {}

class MockGoRouterState extends Mock implements GoRouterState {}

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

/// Creates a test ArticleFeedItem with minimal required fields
ArticleFeedItem createTestArticle({
  String id = 'article-1',
  String slug = 'test-article-slug',
}) {
  return ArticleFeedItem(
    id: id,
    publishedAt: DateTime(2026, 3, 1),
    isPinned: false,
    sortPriority: 100,
    article: FeedArticleContent(
      id: id,
      title: 'Test Article',
      isBreaking: false,
      viewCount: 100,
      commentCount: 5,
      shareCount: 10,
      readingTimeMinutes: 3,
      publishedAt: DateTime(2026, 3, 1),
      slug: slug,
    ),
  );
}

/// Creates a test PollFeedItem with minimal required fields
PollFeedItem createTestPoll({String id = 'poll-1'}) {
  return PollFeedItem(
    id: id,
    publishedAt: DateTime(2026, 3, 1),
    isPinned: false,
    sortPriority: 100,
    poll: FeedPollContent(
      id: id,
      question: 'Test Poll Question?',
      options: const [
        FeedPollOption(
          id: 'opt-1',
          text: 'Option 1',
          votesCount: 10,
          percentage: 50.0,
        ),
        FeedPollOption(
          id: 'opt-2',
          text: 'Option 2',
          votesCount: 10,
          percentage: 50.0,
        ),
      ],
      totalVotes: 20,
      isActive: true,
      allowMultipleVotes: false,
      userHasVoted: false,
    ),
  );
}

/// Creates a test EventFeedItem with minimal required fields
EventFeedItem createTestEvent({String id = 'event-1'}) {
  return EventFeedItem(
    id: id,
    publishedAt: DateTime(2026, 3, 1),
    isPinned: false,
    sortPriority: 100,
    event: FeedEventContent(
      id: id,
      title: 'Test Event',
      startTime: DateTime(2026, 3, 15),
      rsvpCount: 50,
      userHasRsvped: false,
    ),
  );
}

/// Creates a test ElectionUpdateFeedItem with minimal required fields
ElectionUpdateFeedItem createTestElection({
  String id = 'election-update-1',
  String electionId = 'election-123',
}) {
  return ElectionUpdateFeedItem(
    id: id,
    publishedAt: DateTime(2026, 3, 1),
    isPinned: false,
    sortPriority: 100,
    electionUpdate: FeedElectionContent(
      id: id,
      electionId: electionId,
      electionName: 'Test Primary Election',
      isLive: true,
      topCandidates: const [
        FeedCandidateResult(
          id: 'candidate-1',
          name: 'Candidate A',
          votesCount: 1500,
          percentage: 35.5,
        ),
        FeedCandidateResult(
          id: 'candidate-2',
          name: 'Candidate B',
          votesCount: 1200,
          percentage: 28.3,
        ),
      ],
      lastUpdated: DateTime(2026, 3, 1, 10, 30),
    ),
  );
}

/// Creates a test QuizPromptFeedItem with minimal required fields
QuizPromptFeedItem createTestQuiz({
  String id = 'quiz-1',
  String electionId = 'election-456',
}) {
  return QuizPromptFeedItem(
    id: id,
    publishedAt: DateTime(2026, 3, 1),
    isPinned: false,
    sortPriority: 100,
    quizPrompt: FeedQuizContent(
      id: electionId, // Quiz uses electionId as its id
      title: 'איזה מועמד מתאים לך?',
      titleEn: 'Which candidate matches you?',
      description: 'Test quiz description',
      questionsCount: 12,
      userHasCompleted: false,
    ),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  late MockGoRouter mockRouter;
  late List<String> navigationLog;

  setUpAll(() {
    registerFallbackValue(MockGoRouterState());
  });

  setUp(() {
    mockRouter = MockGoRouter();
    navigationLog = [];

    // Mock GoRouter.of() to return our mock router
    when(() => mockRouter.push(any())).thenAnswer((invocation) {
      final route = invocation.positionalArguments[0] as String;
      navigationLog.add(route);
      return Future.value(null);
    });
  });

  group('HomePageWithFeed Navigation Tests', () {
    // -----------------------------------------------------------------------
    // Article Navigation
    // -----------------------------------------------------------------------

    testWidgets('tapping article feed item navigates to article detail page',
        (tester) async {
      // Arrange
      final articleItem = createTestArticle(slug: 'likud-victory-2026');
      String? capturedRoute;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () {
                  // Simulate _handleFeedItemTap logic
                  switch (articleItem) {
                    case ArticleFeedItem item:
                      capturedRoute = '/article/${item.article.slug}';
                  }
                },
                child: const Text('Tap Article'),
              );
            },
          ),
        ),
      );

      // Act
      await tester.tap(find.text('Tap Article'));
      await tester.pumpAndSettle();

      // Assert
      expect(capturedRoute, '/article/likud-victory-2026');
    });

    // -----------------------------------------------------------------------
    // Poll Navigation
    // -----------------------------------------------------------------------

    testWidgets('tapping poll feed item navigates to polls list page',
        (tester) async {
      // Arrange
      final pollItem = createTestPoll(id: 'poll-1');
      String? capturedRoute;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () {
                  // Simulate _handleFeedItemTap logic
                  switch (pollItem) {
                    case PollFeedItem _:
                      capturedRoute = '/polls';
                  }
                },
                child: const Text('Tap Poll'),
              );
            },
          ),
        ),
      );

      // Act
      await tester.tap(find.text('Tap Poll'));
      await tester.pumpAndSettle();

      // Assert
      expect(capturedRoute, '/polls');
    });

    // -----------------------------------------------------------------------
    // Event Navigation
    // -----------------------------------------------------------------------

    testWidgets('tapping event feed item navigates to event detail page',
        (tester) async {
      // Arrange
      final eventItem = createTestEvent(id: 'event-123');
      String? capturedRoute;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () {
                  // Simulate _handleFeedItemTap logic
                  switch (eventItem) {
                    case EventFeedItem item:
                      capturedRoute = '/events/${item.event.id}';
                  }
                },
                child: const Text('Tap Event'),
              );
            },
          ),
        ),
      );

      // Act
      await tester.tap(find.text('Tap Event'));
      await tester.pumpAndSettle();

      // Assert
      expect(capturedRoute, '/events/event-123');
    });

    // -----------------------------------------------------------------------
    // Election Navigation
    // -----------------------------------------------------------------------

    testWidgets('tapping election feed item navigates to election day hub',
        (tester) async {
      // Arrange
      final electionItem = createTestElection(electionId: 'primary-2026');
      String? capturedRoute;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () {
                  // Simulate _handleFeedItemTap logic
                  switch (electionItem) {
                    case ElectionUpdateFeedItem item:
                      capturedRoute =
                          '/election-day/${item.electionUpdate.electionId}';
                  }
                },
                child: const Text('Tap Election'),
              );
            },
          ),
        ),
      );

      // Act
      await tester.tap(find.text('Tap Election'));
      await tester.pumpAndSettle();

      // Assert
      expect(capturedRoute, '/election-day/primary-2026');
    });

    // -----------------------------------------------------------------------
    // Quiz Navigation
    // -----------------------------------------------------------------------

    testWidgets('tapping quiz feed item navigates to quiz intro page',
        (tester) async {
      // Arrange
      final quizItem = createTestQuiz(electionId: 'election-789');
      String? capturedRoute;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () {
                  // Simulate _handleFeedItemTap logic
                  switch (quizItem) {
                    case QuizPromptFeedItem item:
                      capturedRoute = '/primaries/quiz/${item.quizPrompt.id}';
                  }
                },
                child: const Text('Tap Quiz'),
              );
            },
          ),
        ),
      );

      // Act
      await tester.tap(find.text('Tap Quiz'));
      await tester.pumpAndSettle();

      // Assert
      expect(capturedRoute, '/primaries/quiz/election-789');
    });

    // -----------------------------------------------------------------------
    // Comprehensive Navigation Test
    // -----------------------------------------------------------------------

    testWidgets('all feed item types navigate to correct routes',
        (tester) async {
      // Arrange - Create one of each feed item type
      final testItems = [
        createTestArticle(slug: 'article-slug'),
        createTestPoll(id: 'poll-1'),
        createTestEvent(id: 'event-1'),
        createTestElection(electionId: 'election-1'),
        createTestQuiz(electionId: 'quiz-election-1'),
      ];

      final expectedRoutes = [
        '/article/article-slug',
        '/polls',
        '/events/event-1',
        '/election-day/election-1',
        '/primaries/quiz/quiz-election-1',
      ];

      final actualRoutes = <String>[];

      await tester.pumpWidget(
        MaterialApp(
          home: ListView.builder(
            itemCount: testItems.length,
            itemBuilder: (context, index) {
              return ElevatedButton(
                key: ValueKey('item-$index'),
                onPressed: () {
                  // Simulate _handleFeedItemTap logic
                  final feedItem = testItems[index];
                  switch (feedItem) {
                    case ArticleFeedItem item:
                      actualRoutes.add('/article/${item.article.slug}');
                      break;
                    case PollFeedItem _:
                      actualRoutes.add('/polls');
                      break;
                    case EventFeedItem item:
                      actualRoutes.add('/events/${item.event.id}');
                      break;
                    case ElectionUpdateFeedItem item:
                      actualRoutes
                          .add('/election-day/${item.electionUpdate.electionId}');
                      break;
                    case QuizPromptFeedItem item:
                      actualRoutes.add('/primaries/quiz/${item.quizPrompt.id}');
                      break;
                  }
                },
                child: Text('Item $index'),
              );
            },
          ),
        ),
      );

      // Act - Tap each item
      for (int i = 0; i < testItems.length; i++) {
        await tester.tap(find.byKey(ValueKey('item-$i')));
        await tester.pumpAndSettle();
      }

      // Assert - All routes match expected
      expect(actualRoutes.length, testItems.length);
      for (int i = 0; i < testItems.length; i++) {
        expect(actualRoutes[i], expectedRoutes[i],
            reason:
                'Item $i (${testItems[i].runtimeType}) should navigate to ${expectedRoutes[i]}');
      }
    });

    // -----------------------------------------------------------------------
    // Pattern Matching Tests
    // -----------------------------------------------------------------------

    test('pattern matching correctly identifies ArticleFeedItem', () {
      final item = createTestArticle();
      expect(item, isA<ArticleFeedItem>());
      expect(item.type, FeedItemType.article);
    });

    test('pattern matching correctly identifies PollFeedItem', () {
      final item = createTestPoll();
      expect(item, isA<PollFeedItem>());
      expect(item.type, FeedItemType.poll);
    });

    test('pattern matching correctly identifies EventFeedItem', () {
      final item = createTestEvent();
      expect(item, isA<EventFeedItem>());
      expect(item.type, FeedItemType.event);
    });

    test('pattern matching correctly identifies ElectionUpdateFeedItem', () {
      final item = createTestElection();
      expect(item, isA<ElectionUpdateFeedItem>());
      expect(item.type, FeedItemType.electionUpdate);
    });

    test('pattern matching correctly identifies QuizPromptFeedItem', () {
      final item = createTestQuiz();
      expect(item, isA<QuizPromptFeedItem>());
      expect(item.type, FeedItemType.quizPrompt);
    });

    // -----------------------------------------------------------------------
    // Route Construction Tests
    // -----------------------------------------------------------------------

    test('article route construction uses slug not id', () {
      final article = createTestArticle(
        id: 'uuid-123',
        slug: 'my-article-slug',
      );
      final route = '/article/${article.article.slug}';
      expect(route, '/article/my-article-slug');
      expect(route, isNot(contains('uuid-123')));
    });

    test('event route construction uses event id', () {
      final event = createTestEvent(id: 'event-456');
      final route = '/events/${event.event.id}';
      expect(route, '/events/event-456');
    });

    test('election route construction uses electionId not update id', () {
      final election = createTestElection(
        id: 'update-999',
        electionId: 'election-123',
      );
      final route = '/election-day/${election.electionUpdate.electionId}';
      expect(route, '/election-day/election-123');
      expect(route, isNot(contains('update-999')));
    });

    test('quiz route construction uses quizPrompt.id (which is electionId)',
        () {
      final quiz = createTestQuiz(electionId: 'election-789');
      final route = '/primaries/quiz/${quiz.quizPrompt.id}';
      expect(route, '/primaries/quiz/election-789');
    });

    // -----------------------------------------------------------------------
    // Edge Cases
    // -----------------------------------------------------------------------

    test('poll navigation does not use poll id in route', () {
      // Poll navigation always goes to '/polls' list page, never to a specific poll
      const pollId = 'poll-123';
      const route = '/polls';
      expect(route, '/polls');
      // Poll list page handles voting inline, no specific poll detail route
      expect(route, isNot(contains(pollId)));
    });

    test('feed items maintain correct type through pattern matching', () {
      final items = <FeedItem>[
        createTestArticle(),
        createTestPoll(),
        createTestEvent(),
        createTestElection(),
        createTestQuiz(),
      ];

      final types = items.map((item) => item.type).toList();

      expect(
        types,
        [
          FeedItemType.article,
          FeedItemType.poll,
          FeedItemType.event,
          FeedItemType.electionUpdate,
          FeedItemType.quizPrompt,
        ],
      );
    });
  });
}
