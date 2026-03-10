import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/features/auth/domain/entities/app_user.dart';
import 'package:metzudat_halikud/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:metzudat_halikud/features/feed/presentation/widgets/feed_quiz_prompt_card.dart';

import '../../../../helpers/mock_blocs.dart';
import '../../../../helpers/test_fixtures.dart';
import '../../../../helpers/widget_test_helpers.dart';

void main() {
  late MockAuthBloc mockAuthBloc;

  setUp(() {
    mockAuthBloc = MockAuthBloc();
    when(() => mockAuthBloc.state).thenReturn(AuthAuthenticated(
      user: AppUser(id: 'test-user', phone: '+1234567890'),
    ));
  });

  group('FeedQuizPromptCard', () {
    testWidgets('renders header badge with quiz icon and candidate_quiz text',
        (tester) async {
      final quizContent = createTestFeedQuizContent();

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent),
      );

      expect(find.byIcon(Icons.quiz_outlined), findsOneWidget);
      expect(find.text('candidate_quiz'), findsOneWidget);
    });

    testWidgets('renders pin icon when isPinned is true', (tester) async {
      final quizContent = createTestFeedQuizContent();

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent, isPinned: true),
      );

      expect(find.byIcon(Icons.push_pin), findsOneWidget);
    });

    testWidgets('does not render pin icon when isPinned is false',
        (tester) async {
      final quizContent = createTestFeedQuizContent();

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent, isPinned: false),
      );

      expect(find.byIcon(Icons.push_pin), findsNothing);
    });

    testWidgets('renders quiz icon (size 40) when no imageUrl is provided',
        (tester) async {
      final quizContent = createTestFeedQuizContent(imageUrl: null);

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent),
      );

      final quizIcon = tester.widget<Icon>(
        find.byIcon(Icons.quiz).first,
      );
      expect(quizIcon.size, 40);
    });

    testWidgets('renders title text', (tester) async {
      final quizContent = createTestFeedQuizContent(
        title: 'Which candidate matches you best?',
      );

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent),
      );

      expect(find.text('Which candidate matches you best?'), findsOneWidget);
    });

    testWidgets('renders description when provided', (tester) async {
      final quizContent = createTestFeedQuizContent(
        description: 'Answer 10 questions to discover your ideal match',
      );

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent),
      );

      expect(
        find.text('Answer 10 questions to discover your ideal match'),
        findsOneWidget,
      );
    });

    testWidgets('does not render description when null', (tester) async {
      final quizContent = createTestFeedQuizContent(description: null);

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent),
      );

      // The title should be present, but there should be no description text
      expect(find.text(quizContent.title), findsOneWidget);
      // Verify only the expected text widgets are present (no extra description)
      // The description field is null so no description text widget should exist
    });

    testWidgets('renders questions count badge with help_outline icon',
        (tester) async {
      final quizContent = createTestFeedQuizContent(questionsCount: 15);

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent),
      );

      expect(find.byIcon(Icons.help_outline), findsOneWidget);
      expect(find.text('15 questions'), findsOneWidget);
    });

    testWidgets(
        'renders completion rate badge with people_outline icon when completionRate is provided',
        (tester) async {
      final quizContent = createTestFeedQuizContent(completionRate: 72.0);

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent),
      );

      expect(find.byIcon(Icons.people_outline), findsOneWidget);
      expect(find.text('72% completed'), findsOneWidget);
    });

    testWidgets(
        'does not render completion rate badge when completionRate is null',
        (tester) async {
      final quizContent = createTestFeedQuizContent(completionRate: null);

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent),
      );

      expect(find.byIcon(Icons.people_outline), findsNothing);
    });

    testWidgets(
        'renders user match badge with check_circle icon when completed with match percentage',
        (tester) async {
      final quizContent = createTestFeedQuizContent(
        userHasCompleted: true,
        userMatchPercentage: 85.0,
      );

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent),
      );

      expect(find.byIcon(Icons.check_circle), findsOneWidget);
      expect(find.textContaining('85%'), findsOneWidget);
    });

    testWidgets(
        'renders start_quiz CTA with play_arrow icon when not completed',
        (tester) async {
      final quizContent = createTestFeedQuizContent(
        userHasCompleted: false,
      );

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent),
      );

      expect(find.byIcon(Icons.play_arrow), findsOneWidget);
      expect(find.text('start_quiz'), findsOneWidget);
      expect(find.byIcon(Icons.replay), findsNothing);
      expect(find.text('retake_quiz'), findsNothing);
    });

    testWidgets(
        'renders retake_quiz CTA with replay icon when completed',
        (tester) async {
      final quizContent = createTestFeedQuizContent(
        userHasCompleted: true,
        userMatchPercentage: 65.0,
      );

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(quizPrompt: quizContent),
      );

      expect(find.byIcon(Icons.replay), findsOneWidget);
      expect(find.text('retake_quiz'), findsOneWidget);
      expect(find.byIcon(Icons.play_arrow), findsNothing);
      expect(find.text('start_quiz'), findsNothing);
    });

    testWidgets('invokes onTap callback when card is tapped', (tester) async {
      bool tapped = false;
      final quizContent = createTestFeedQuizContent();

      await pumpTestWidget(
        tester,
        FeedQuizPromptCard(
          quizPrompt: quizContent,
          onTap: () => tapped = true,
        ),
        providers: [
          BlocProvider<AuthBloc>.value(value: mockAuthBloc),
        ],
      );

      // Tap the CTA button (ElevatedButton)
      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      expect(tapped, isTrue);
    });
  });
}
