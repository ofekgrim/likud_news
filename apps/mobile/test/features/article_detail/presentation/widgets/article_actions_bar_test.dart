import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/features/article_detail/presentation/widgets/article_actions_bar.dart';
import 'package:metzudat_halikud/features/article_detail/presentation/bloc/article_detail_bloc.dart';

import '../../../../helpers/mock_blocs.dart';
import '../../../../helpers/test_fixtures.dart';
import '../../../../helpers/widget_test_helpers.dart';

void main() {
  late MockArticleDetailBloc mockArticleDetailBloc;

  setUp(() {
    mockArticleDetailBloc = MockArticleDetailBloc();
  });

  group('ArticleActionsBar', () {
    testWidgets('renders share label text', (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailInitial());

      await pumpTestWidget(
        tester,
        ArticleActionsBar(),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
        ],
      );

      // 'share_label' is the translation key
      expect(find.text('share_label'), findsOneWidget);
    });

    testWidgets('renders WhatsApp share icon', (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailInitial());

      await pumpTestWidget(
        tester,
        ArticleActionsBar(),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
        ],
      );

      expect(find.byIcon(Icons.chat), findsOneWidget);
    });

    testWidgets('renders Telegram share icon', (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailInitial());

      await pumpTestWidget(
        tester,
        ArticleActionsBar(),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
        ],
      );

      expect(find.byIcon(Icons.send), findsOneWidget);
    });

    testWidgets('renders Facebook share icon', (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailInitial());

      await pumpTestWidget(
        tester,
        ArticleActionsBar(),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
        ],
      );

      expect(find.byIcon(Icons.facebook), findsOneWidget);
    });

    testWidgets('renders X (Twitter) share icon', (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailInitial());

      await pumpTestWidget(
        tester,
        ArticleActionsBar(),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
        ],
      );

      expect(find.byIcon(Icons.alternate_email), findsOneWidget);
    });

    testWidgets('renders copy link icon', (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailInitial());

      await pumpTestWidget(
        tester,
        ArticleActionsBar(),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
        ],
      );

      expect(find.byIcon(Icons.link), findsOneWidget);
    });

    testWidgets('renders unfilled bookmark when not favorited', (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailInitial());

      await pumpTestWidget(
        tester,
        ArticleActionsBar(),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
        ],
      );

      expect(find.byIcon(Icons.bookmark_border), findsOneWidget);
      expect(find.byIcon(Icons.bookmark), findsNothing);
    });

    testWidgets('renders filled bookmark when favorited', (tester) async {
      when(() => mockArticleDetailBloc.state).thenReturn(
        ArticleDetailLoaded(
          article: createTestArticleDetail(),
          isFavorite: true,
          fontScale: 1.0,
        ),
      );

      await pumpTestWidget(
        tester,
        ArticleActionsBar(),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
        ],
      );

      expect(find.byIcon(Icons.bookmark), findsOneWidget);
    });

    testWidgets('dispatches ShareArticle when share icon is tapped',
        (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailInitial());

      await pumpTestWidget(
        tester,
        ArticleActionsBar(),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
        ],
      );

      await tester.tap(find.byIcon(Icons.chat));
      verify(() => mockArticleDetailBloc
          .add(const ShareArticle(SharePlatform.whatsapp))).called(1);
    });
  });
}
