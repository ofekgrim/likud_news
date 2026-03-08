import 'package:bloc_test/bloc_test.dart';
import 'package:metzudat_halikud/features/article_detail/presentation/bloc/article_detail_bloc.dart';
import 'package:metzudat_halikud/features/article_detail/presentation/bloc/comments_bloc.dart';
import 'package:metzudat_halikud/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:metzudat_halikud/features/categories/presentation/bloc/categories_bloc.dart';
import 'package:metzudat_halikud/features/community_polls/presentation/bloc/polls_bloc.dart';
import 'package:metzudat_halikud/features/feed/presentation/bloc/feed_bloc.dart';
import 'package:metzudat_halikud/features/feed/presentation/bloc/feed_event.dart';
import 'package:metzudat_halikud/features/feed/presentation/bloc/feed_state.dart';
import 'package:metzudat_halikud/features/search/presentation/bloc/search_bloc.dart';
import 'package:metzudat_halikud/features/settings/presentation/bloc/settings_bloc.dart';

class MockFeedBloc extends MockBloc<FeedEvent, FeedState> implements FeedBloc {}

class MockArticleDetailBloc
    extends MockBloc<ArticleDetailEvent, ArticleDetailState>
    implements ArticleDetailBloc {}

class MockCommentsBloc extends MockBloc<CommentsEvent, CommentsState>
    implements CommentsBloc {}

class MockPollsBloc extends MockBloc<PollsEvent, PollsState>
    implements PollsBloc {}

class MockCategoriesBloc extends MockBloc<CategoriesEvent, CategoriesState>
    implements CategoriesBloc {}

class MockSearchBloc extends MockBloc<SearchEvent, SearchState>
    implements SearchBloc {}

class MockSettingsBloc extends MockBloc<SettingsEvent, SettingsState>
    implements SettingsBloc {}

class MockAuthBloc extends MockBloc<AuthEvent, AuthState>
    implements AuthBloc {}
