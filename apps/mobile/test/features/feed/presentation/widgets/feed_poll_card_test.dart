import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/features/feed/domain/entities/feed_item.dart';
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

  Widget buildSubject({
    FeedPollContent? poll,
    bool isPinned = false,
    VoidCallback? onTap,
  }) {
    return SingleChildScrollView(
      child: FeedPollCard(
        poll: poll ?? createTestFeedPollContent(),
        isPinned: isPinned,
        onTap: onTap,
      ),
    );
  }

  group('FeedPollCard', () {
    testWidgets('renders poll icon', (tester) async {
      await pumpTestWidget(
        tester,
        buildSubject(),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byIcon(Icons.poll_outlined), findsOneWidget);
    });

    testWidgets('renders question text', (tester) async {
      final poll = createTestFeedPollContent(question: 'Who should lead?');

      await pumpTestWidget(
        tester,
        buildSubject(poll: poll),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.text('Who should lead?'), findsOneWidget);
    });

    testWidgets('renders poll option texts', (tester) async {
      await pumpTestWidget(
        tester,
        buildSubject(),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.text('Option A'), findsOneWidget);
      expect(find.text('Option B'), findsOneWidget);
    });

    testWidgets('renders radio button icons for options', (tester) async {
      await pumpTestWidget(
        tester,
        buildSubject(),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byIcon(Icons.radio_button_unchecked), findsWidgets);
    });

    testWidgets('renders people icon and vote count', (tester) async {
      final poll = createTestFeedPollContent(totalVotes: 250);

      await pumpTestWidget(
        tester,
        buildSubject(poll: poll),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byIcon(Icons.people_outline), findsOneWidget);
      // The text contains totalVotes + 'votes' translation key
      expect(find.textContaining('250'), findsOneWidget);
    });

    testWidgets('renders pin icon when isPinned is true', (tester) async {
      await pumpTestWidget(
        tester,
        buildSubject(isPinned: true),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byIcon(Icons.push_pin), findsOneWidget);
    });

    testWidgets('does not render pin icon when isPinned is false',
        (tester) async {
      await pumpTestWidget(
        tester,
        buildSubject(isPinned: false),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byIcon(Icons.push_pin), findsNothing);
    });

    testWidgets('renders closed badge when poll is inactive', (tester) async {
      final poll = createTestFeedPollContent(isActive: false);

      await pumpTestWidget(
        tester,
        buildSubject(poll: poll),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      // 'polls_closed' is the translation key (rendered as-is without easy_localization init)
      expect(find.text('polls_closed'), findsOneWidget);
    });

    testWidgets('renders timer icon when endsAt is set', (tester) async {
      final poll = createTestFeedPollContent(
        endsAt: DateTime.now().add(const Duration(days: 5)),
      );

      await pumpTestWidget(
        tester,
        buildSubject(poll: poll),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byIcon(Icons.timer_outlined), findsOneWidget);
    });

    testWidgets('does not render timer icon when endsAt is null',
        (tester) async {
      final poll = createTestFeedPollContent(endsAt: null);

      await pumpTestWidget(
        tester,
        buildSubject(poll: poll),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byIcon(Icons.timer_outlined), findsNothing);
    });

    testWidgets('renders Card widget', (tester) async {
      await pumpTestWidget(
        tester,
        buildSubject(),
        providers: [
          BlocProvider<PollsBloc>.value(value: mockPollsBloc),
        ],
      );

      expect(find.byType(Card), findsOneWidget);
    });
  });
}
