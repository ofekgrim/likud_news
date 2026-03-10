import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/features/article_detail/presentation/pages/article_detail_page.dart';
import 'package:metzudat_halikud/features/article_detail/presentation/bloc/article_detail_bloc.dart';
import 'package:metzudat_halikud/features/article_detail/presentation/bloc/comments_bloc.dart';

import '../../../../helpers/mock_blocs.dart';
import '../../../../helpers/widget_test_helpers.dart';

void main() {
  late MockArticleDetailBloc mockArticleDetailBloc;
  late MockCommentsBloc mockCommentsBloc;

  setUp(() {
    mockArticleDetailBloc = MockArticleDetailBloc();
    mockCommentsBloc = MockCommentsBloc();
    when(() => mockCommentsBloc.state).thenReturn(const CommentsInitial());
  });

  group('ArticleDetailPage', () {
    testWidgets('shows CircularProgressIndicator for initial state',
        (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailInitial());

      await pumpTestWidget(
        tester,
        const ArticleDetailPage(slug: 'test-slug'),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
          BlocProvider<CommentsBloc>.value(value: mockCommentsBloc),
        ],
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows CircularProgressIndicator for loading state',
        (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailLoading());

      await pumpTestWidget(
        tester,
        const ArticleDetailPage(slug: 'test-slug'),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
          BlocProvider<CommentsBloc>.value(value: mockCommentsBloc),
        ],
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows error message for error state', (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailError('Failed to load article'));

      await pumpTestWidget(
        tester,
        const ArticleDetailPage(slug: 'test-slug'),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
          BlocProvider<CommentsBloc>.value(value: mockCommentsBloc),
        ],
      );

      expect(find.text('Failed to load article'), findsOneWidget);
    });

    testWidgets('shows retry button for error state', (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailError('Error'));

      await pumpTestWidget(
        tester,
        const ArticleDetailPage(slug: 'test-slug'),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
          BlocProvider<CommentsBloc>.value(value: mockCommentsBloc),
        ],
      );

      expect(find.text('try_again'), findsOneWidget);
    });

    testWidgets('dispatches LoadArticleDetail on retry', (tester) async {
      when(() => mockArticleDetailBloc.state)
          .thenReturn(const ArticleDetailError('Error'));

      await pumpTestWidget(
        tester,
        const ArticleDetailPage(slug: 'my-article'),
        providers: [
          BlocProvider<ArticleDetailBloc>.value(value: mockArticleDetailBloc),
          BlocProvider<CommentsBloc>.value(value: mockCommentsBloc),
        ],
      );

      await tester.tap(find.text('try_again'));
      verify(() => mockArticleDetailBloc
          .add(const LoadArticleDetail('my-article'))).called(1);
    });
  });
}
