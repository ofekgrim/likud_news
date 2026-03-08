import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../helpers/widget_test_helpers.dart';
import 'package:metzudat_halikud/core/widgets/error_view.dart';

void main() {
  // ---------------------------------------------------------------------------
  // ErrorView
  // ---------------------------------------------------------------------------

  group('ErrorView', () {
    testWidgets('renders the error message', (tester) async {
      await pumpTestWidget(
        tester,
        const ErrorView(message: 'Something went wrong'),
      );

      expect(find.text('Something went wrong'), findsOneWidget);
    });

    testWidgets('renders the default error icon', (tester) async {
      await pumpTestWidget(
        tester,
        const ErrorView(message: 'Error occurred'),
      );

      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('renders retry button when onRetry is provided',
        (tester) async {
      await pumpTestWidget(
        tester,
        ErrorView(
          message: 'Error occurred',
          onRetry: () {},
        ),
      );

      expect(find.byType(FilledButton), findsOneWidget);
      expect(find.byIcon(Icons.refresh), findsOneWidget);
    });

    testWidgets('hides retry button when onRetry is null', (tester) async {
      await pumpTestWidget(
        tester,
        const ErrorView(message: 'Error occurred'),
      );

      expect(find.byType(FilledButton), findsNothing);
      expect(find.byIcon(Icons.refresh), findsNothing);
    });

    testWidgets('triggers onRetry callback when retry button is tapped',
        (tester) async {
      var retryCount = 0;

      await pumpTestWidget(
        tester,
        ErrorView(
          message: 'Error occurred',
          onRetry: () => retryCount++,
        ),
      );

      await tester.tap(find.byType(FilledButton));
      await tester.pump();

      expect(retryCount, 1);
    });

    testWidgets('uses custom icon when provided', (tester) async {
      await pumpTestWidget(
        tester,
        const ErrorView(
          message: 'No connection',
          icon: Icons.wifi_off,
        ),
      );

      expect(find.byIcon(Icons.wifi_off), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsNothing);
    });
  });

  // ---------------------------------------------------------------------------
  // EmptyView
  // ---------------------------------------------------------------------------

  group('EmptyView', () {
    testWidgets('renders the empty message', (tester) async {
      await pumpTestWidget(
        tester,
        const EmptyView(message: 'No items found'),
      );

      expect(find.text('No items found'), findsOneWidget);
    });

    testWidgets('renders the default inbox icon', (tester) async {
      await pumpTestWidget(
        tester,
        const EmptyView(message: 'No items found'),
      );

      expect(find.byIcon(Icons.inbox_outlined), findsOneWidget);
    });

    testWidgets('uses custom icon when provided', (tester) async {
      await pumpTestWidget(
        tester,
        const EmptyView(
          message: 'No bookmarks',
          icon: Icons.bookmark_border,
        ),
      );

      expect(find.byIcon(Icons.bookmark_border), findsOneWidget);
      expect(find.byIcon(Icons.inbox_outlined), findsNothing);
    });

    testWidgets('does not render any button', (tester) async {
      await pumpTestWidget(
        tester,
        const EmptyView(message: 'Empty'),
      );

      expect(find.byType(ElevatedButton), findsNothing);
      expect(find.byType(FilledButton), findsNothing);
      expect(find.byType(TextButton), findsNothing);
      expect(find.byType(OutlinedButton), findsNothing);
    });
  });
}
