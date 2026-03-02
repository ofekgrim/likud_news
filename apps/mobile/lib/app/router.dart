import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:talker_flutter/talker_flutter.dart';

import '../core/services/app_logger.dart';
import 'di.dart';

// BLoC imports
import '../features/home/presentation/bloc/home_bloc.dart';
import '../features/breaking_news/presentation/bloc/breaking_news_bloc.dart';
import '../features/video/presentation/bloc/video_bloc.dart';
import '../features/stories/presentation/bloc/stories_bloc.dart';
import '../features/article_detail/presentation/bloc/article_detail_bloc.dart';
import '../features/members/presentation/bloc/members_bloc.dart';
import '../features/search/presentation/bloc/search_bloc.dart';
import '../features/categories/presentation/bloc/categories_bloc.dart';
import '../features/settings/presentation/bloc/settings_bloc.dart';
import '../features/favorites/presentation/bloc/favorites_bloc.dart';
import '../features/contact/presentation/bloc/contact_bloc.dart';
import '../features/article_detail/presentation/bloc/comments_bloc.dart';
import '../features/tag_articles/presentation/bloc/tag_articles_bloc.dart';
import '../features/author_articles/presentation/bloc/author_articles_bloc.dart';
import '../features/candidates/presentation/bloc/candidates_bloc.dart';
import '../features/candidate_quiz/presentation/bloc/quiz_bloc.dart';
import '../features/candidate_quiz/presentation/bloc/quiz_list_bloc.dart';
import '../features/election_day/presentation/bloc/election_day_bloc.dart';
import '../features/election_day/presentation/pages/election_day_page.dart';
import '../features/community_polls/presentation/bloc/polls_bloc.dart';
import '../features/community_polls/presentation/pages/polls_page.dart';
import '../features/campaign_events/presentation/bloc/events_bloc.dart';
import '../features/campaign_events/presentation/pages/events_page.dart';
import '../features/campaign_events/presentation/pages/event_detail_page.dart';
import '../features/membership/presentation/bloc/membership_bloc.dart';
import '../features/membership/presentation/pages/membership_page.dart';
import '../features/gamification/presentation/bloc/gamification_bloc.dart';
import '../features/gamification/presentation/pages/gamification_page.dart';

// Feature page imports
import '../features/home/presentation/pages/home_page_with_feed.dart';
import '../features/breaking_news/presentation/pages/breaking_news_page.dart';
import '../features/video/presentation/pages/video_page.dart';
import '../features/stories/presentation/pages/stories_page.dart';
import '../features/more/presentation/pages/more_page.dart';
import '../features/article_detail/presentation/pages/article_detail_page.dart';
import '../features/members/presentation/pages/member_detail_page.dart';
import '../features/members/presentation/pages/members_page.dart';
import '../features/search/presentation/pages/search_page.dart';
import '../features/categories/presentation/pages/categories_page.dart';
import '../features/categories/presentation/widgets/category_articles_page.dart';
import '../features/settings/presentation/pages/settings_page.dart';
import '../features/favorites/presentation/pages/favorites_page.dart';
import '../features/contact/presentation/pages/contact_page.dart';
import '../features/about/presentation/pages/about_page.dart';
import '../features/accessibility/presentation/pages/accessibility_page.dart';
import '../features/privacy/presentation/pages/privacy_page.dart';
import '../features/tag_articles/presentation/pages/tag_articles_page.dart';
import '../features/author_articles/presentation/pages/author_articles_page.dart';
import '../features/candidates/presentation/pages/candidates_page.dart';
import '../features/candidates/presentation/pages/candidate_detail_page.dart';
import '../features/candidate_quiz/presentation/pages/quiz_list_page.dart';
import '../features/candidate_quiz/presentation/pages/quiz_intro_page.dart';
import '../features/candidate_quiz/presentation/pages/quiz_page.dart';
import '../features/candidate_quiz/presentation/pages/quiz_results_page.dart';
import '../features/video/domain/entities/video_article.dart';
import '../features/video/presentation/pages/video_player_page.dart';
import '../features/article_detail/domain/entities/content_block.dart';
import '../features/auth/presentation/bloc/auth_bloc.dart';
import '../features/auth/presentation/pages/login_page.dart';
import '../features/auth/presentation/pages/otp_verification_page.dart';
import '../features/auth/presentation/pages/register_page.dart';
import 'router_refresh.dart';
import '../features/user_profile/presentation/bloc/user_profile_bloc.dart';
import '../features/user_profile/presentation/pages/profile_page.dart';
import '../features/user_profile/presentation/pages/edit_profile_page.dart';
import '../features/user_profile/presentation/pages/notification_prefs_page.dart';
import '../features/enhanced_favorites/presentation/bloc/enhanced_favorites_bloc.dart';
import '../features/enhanced_favorites/presentation/pages/folders_page.dart';
import '../features/enhanced_favorites/presentation/pages/folder_detail_page.dart';
import '../features/enhanced_favorites/domain/entities/bookmark_folder.dart';
import '../features/enhanced_favorites/domain/repositories/enhanced_favorites_repository.dart';
import 'widgets/liquid_glass_nav_bar.dart';
import 'widgets/app_drawer.dart';

/// App router configuration using GoRouter.
///
/// Uses StatefulShellRoute for persistent bottom tab navigation
/// across 5 main tabs: Home, Breaking, Video, Magazine, More.
class AppRouter {
  AppRouter._();

  static final scaffoldKey = GlobalKey<ScaffoldState>();

  /// Calculates the bottom clearance needed to avoid the floating nav bar.
  static double bottomNavClearance(BuildContext context) {
    return MediaQuery.of(context).padding.bottom + 90;
  }

  static GoRouter createRouter(AuthBloc authBloc) => GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: false, // Replaced by TalkerRouteObserver
    observers: [TalkerRouteObserver(AppLogger.instance)],
    refreshListenable: GoRouterRefreshStream(authBloc.stream),
    redirect: (context, state) {
      final authState = authBloc.state;
      final location = state.matchedLocation;

      // Still checking auth — don't redirect
      if (authState is AuthInitial || authState is AuthLoading) return null;

      final isAuthenticated = authState is AuthAuthenticated;

      // Auth routes that logged-in users shouldn't see
      final isAuthRoute = location == '/login' ||
          location == '/register' ||
          location == '/otp-verify';

      // Protected routes that require login
      final isProtectedRoute = location.startsWith('/profile') ||
          location.startsWith('/folders');

      // Authenticated on auth page → go home
      if (isAuthenticated && isAuthRoute) return '/';

      // Unauthenticated on protected route → go to login
      if (!isAuthenticated && isProtectedRoute) return '/login';

      return null;
    },
    routes: [
      // Bottom tab navigation shell
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return _MainShell(navigationShell: navigationShell);
        },
        branches: [
          // Tab 1: Home (ראשי)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                builder: (context, state) => BlocProvider(
                  create: (_) => getIt<HomeBloc>(),
                  child: const HomePageWithFeed(),
                ),
              ),
            ],
          ),
          // Tab 2: Breaking News (מבזקים)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/breaking',
                builder: (context, state) => BlocProvider(
                  create: (_) => getIt<BreakingNewsBloc>(),
                  child: const BreakingNewsPage(),
                ),
              ),
            ],
          ),
          // Tab 3: Video (וידאו)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/video',
                builder: (context, state) => BlocProvider(
                  create: (_) => getIt<VideoBloc>(),
                  child: const VideoPage(),
                ),
              ),
            ],
          ),
          // Tab 4: Stories (סטוריז)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/stories',
                builder: (context, state) => BlocProvider(
                  create: (_) => getIt<StoriesBloc>(),
                  child: const StoriesPage(),
                ),
              ),
            ],
          ),
          // Tab 5: More (☰)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/more',
                builder: (context, state) => const MorePage(),
              ),
            ],
          ),
        ],
      ),

      // Full-screen routes (outside tab shell)
      GoRoute(
        path: '/article/:slug',
        builder: (context, state) => MultiBlocProvider(
          providers: [
            BlocProvider(create: (_) => getIt<ArticleDetailBloc>()),
            BlocProvider(create: (_) => getIt<CommentsBloc>()),
          ],
          child: _SmartArticlePage(slug: state.pathParameters['slug']!),
        ),
      ),
      GoRoute(
        path: '/member/:id',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<MembersBloc>(),
          child: MemberDetailPage(memberId: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/members',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<MembersBloc>(),
          child: const MembersPage(),
        ),
      ),
      GoRoute(
        path: '/search',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<SearchBloc>(),
          child: const SearchPage(),
        ),
      ),
      GoRoute(
        path: '/categories',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<CategoriesBloc>(),
          child: const CategoriesPage(),
        ),
      ),
      GoRoute(
        path: '/category/:slug',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<CategoriesBloc>(),
          child: CategoryArticlesPage(
            slug: state.pathParameters['slug']!,
            name: state.uri.queryParameters['name'] ?? '',
          ),
        ),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<SettingsBloc>(),
          child: const SettingsPage(),
        ),
      ),
      GoRoute(
        path: '/favorites',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<FavoritesBloc>(),
          child: const FavoritesPage(),
        ),
      ),
      GoRoute(
        path: '/contact',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<ContactBloc>(),
          child: const ContactPage(),
        ),
      ),
      GoRoute(path: '/about', builder: (context, state) => const AboutPage()),
      GoRoute(
        path: '/accessibility',
        builder: (context, state) => const AccessibilityPage(),
      ),
      GoRoute(
        path: '/privacy',
        builder: (context, state) => const PrivacyPage(),
      ),

      // Auth routes
      GoRoute(
        path: '/login',
        builder: (context, state) => BlocProvider.value(
          value: getIt<AuthBloc>(),
          child: const LoginPage(),
        ),
      ),
      GoRoute(
        path: '/otp-verify',
        builder: (context, state) {
          final phone = state.extra as String? ?? '';
          return BlocProvider.value(
            value: getIt<AuthBloc>(),
            child: OtpVerificationPage(phone: phone),
          );
        },
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => BlocProvider.value(
          value: getIt<AuthBloc>(),
          child: const RegisterPage(),
        ),
      ),

      // Profile routes
      GoRoute(
        path: '/profile',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<UserProfileBloc>(),
          child: const ProfilePage(),
        ),
      ),
      GoRoute(
        path: '/profile/edit',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<UserProfileBloc>(),
          child: const EditProfilePage(),
        ),
      ),
      GoRoute(
        path: '/profile/notifications',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<UserProfileBloc>(),
          child: const NotificationPrefsPage(),
        ),
      ),

      // Enhanced favorites routes
      GoRoute(
        path: '/folders',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<EnhancedFavoritesBloc>(),
          child: const FoldersPage(),
        ),
      ),
      GoRoute(
        path: '/folders/:id',
        builder: (context, state) {
          final folder = state.extra as BookmarkFolder;
          return MultiRepositoryProvider(
            providers: [
              RepositoryProvider<EnhancedFavoritesRepository>(
                create: (_) => getIt<EnhancedFavoritesRepository>(),
              ),
            ],
            child: BlocProvider(
              create: (_) => getIt<EnhancedFavoritesBloc>(),
              child: FolderDetailPage(folder: folder),
            ),
          );
        },
      ),

      GoRoute(
        path: '/tag/:slug',
        builder: (context, state) {
          final slug = state.pathParameters['slug']!;
          final name = state.uri.queryParameters['name'] ?? slug;
          return BlocProvider(
            create: (_) {
              final bloc = getIt<TagArticlesBloc>();
              bloc.setTagName(name);
              bloc.add(LoadTagArticles(slug: slug));
              return bloc;
            },
            child: TagArticlesPage(slug: slug, name: name),
          );
        },
      ),
      GoRoute(
        path: '/author/:id',
        builder: (context, state) {
          final authorId = state.pathParameters['id']!;
          return BlocProvider(
            create: (_) {
              final bloc = getIt<AuthorArticlesBloc>();
              bloc.add(LoadAuthorArticles(authorId: authorId));
              return bloc;
            },
            child: AuthorArticlesPage(authorId: authorId),
          );
        },
      ),

      // Primaries routes
      GoRoute(
        path: '/primaries',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<CandidatesBloc>(),
          child: const CandidatesPage(),
        ),
      ),
      GoRoute(
        path: '/candidate/:slug',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<CandidatesBloc>(),
          child: CandidateDetailPage(slug: state.pathParameters['slug']!),
        ),
      ),
      GoRoute(
        path: '/primaries/quiz',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<QuizListBloc>(),
          child: const QuizListPage(),
        ),
      ),
      GoRoute(
        path: '/primaries/quiz/:electionId',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<QuizBloc>(),
          child: QuizIntroPage(electionId: state.pathParameters['electionId']!),
        ),
      ),
      GoRoute(
        path: '/primaries/quiz/:electionId/questions',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<QuizBloc>(),
          child: QuizPage(electionId: state.pathParameters['electionId']!),
        ),
      ),
      GoRoute(
        path: '/primaries/quiz/:electionId/results',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<QuizBloc>(),
          child: QuizResultsPage(
            electionId: state.pathParameters['electionId']!,
          ),
        ),
      ),

      // Sprint 6 routes
      GoRoute(
        path: '/election-day/:electionId',
        builder: (context, state) {
          final electionId = state.pathParameters['electionId']!;
          return BlocProvider(
            create: (_) => getIt<ElectionDayBloc>(),
            child: ElectionDayPage(electionId: electionId),
          );
        },
      ),
      GoRoute(
        path: '/polls',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<PollsBloc>(),
          child: const PollsPage(),
        ),
      ),
      GoRoute(
        path: '/events',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<EventsBloc>(),
          child: const EventsPage(),
        ),
      ),
      GoRoute(
        path: '/events/:id',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<EventsBloc>(),
          child: EventDetailPage(eventId: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/membership',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<MembershipBloc>(),
          child: const MembershipPage(),
        ),
      ),
      GoRoute(
        path: '/gamification',
        builder: (context, state) => BlocProvider(
          create: (_) => getIt<GamificationBloc>(),
          child: const GamificationPage(),
        ),
      ),
    ],
  );
}

/// Main shell widget with floating LiquidGlass bottom nav bar and drawer.
class _MainShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const _MainShell({required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: AppRouter.scaffoldKey,
      extendBody: true,
      drawer: const AppDrawer(),
      body: Stack(
        children: [
          // Main content
          navigationShell,
          // Floating bottom nav
          Positioned(
            bottom: MediaQuery.of(context).padding.bottom + 12,
            left: 16,
            right: 16,
            child: LiquidGlassNavBar(
              selectedIndex: navigationShell.currentIndex,
              onTap: (index) {
                navigationShell.goBranch(
                  index,
                  initialLocation: index == navigationShell.currentIndex,
                );
              },
              items: [
                LiquidGlassNavItem(
                  icon: Icons.home_outlined,
                  selectedIcon: Icons.home,
                  label: 'home'.tr(),
                ),
                LiquidGlassNavItem(
                  icon: Icons.flash_on_outlined,
                  selectedIcon: Icons.flash_on,
                  label: 'breaking_news'.tr(),
                ),
                LiquidGlassNavItem(
                  icon: Icons.play_circle_outline,
                  selectedIcon: Icons.play_circle,
                  label: 'video'.tr(),
                ),
                LiquidGlassNavItem(
                  icon: Icons.auto_awesome_outlined,
                  selectedIcon: Icons.auto_awesome,
                  label: 'stories'.tr(),
                ),
                LiquidGlassNavItem(
                  icon: Icons.menu,
                  selectedIcon: Icons.menu,
                  label: 'more'.tr(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Routes to [VideoPlayerPage] for video-category articles, otherwise
/// shows the normal [ArticleDetailPage].
///
/// Only articles whose category slug is `'video'` are treated as video
/// articles. All other articles render the standard detail page.
class _SmartArticlePage extends StatefulWidget {
  final String slug;

  const _SmartArticlePage({required this.slug});

  @override
  State<_SmartArticlePage> createState() => _SmartArticlePageState();
}

class _SmartArticlePageState extends State<_SmartArticlePage> {
  @override
  void initState() {
    super.initState();
    context.read<ArticleDetailBloc>().add(LoadArticleDetail(widget.slug));
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ArticleDetailBloc, ArticleDetailState>(
      listener: (context, state) {
        if (state is ArticleDetailLoaded &&
            state.article.categorySlug == 'video') {
          context.read<CommentsBloc>().add(
            LoadComments(articleId: state.article.id, targetType: 'article'),
          );
        }
      },
      builder: (context, state) {
        if (state is ArticleDetailLoaded &&
            state.article.categorySlug == 'video') {
          final article = state.article;
          final videoUrl = _extractVideoUrl(article.bodyBlocks);
          if (videoUrl != null) {
            final videoArticle = VideoArticle(
              id: article.id,
              title: article.title,
              subtitle: article.subtitle,
              heroImageUrl: article.heroImageUrl,
              videoUrl: videoUrl,
              categoryName: article.categoryName,
              categoryColor: article.categoryColor,
              slug: article.slug,
              publishedAt: article.publishedAt,
            );
            return VideoPlayerPage(video: videoArticle);
          }
        }
        return ArticleDetailPage(slug: widget.slug);
      },
    );
  }

  String? _extractVideoUrl(List<ContentBlock> bodyBlocks) {
    for (final block in bodyBlocks) {
      if (block is VideoBlock) {
        if (block.source == 'youtube' && block.videoId != null) {
          return 'https://www.youtube.com/watch?v=${block.videoId}';
        }
        if (block.url != null) {
          return block.url;
        }
      }
      if (block is YouTubeEmbedBlock) {
        return 'https://www.youtube.com/watch?v=${block.videoId}';
      }
    }
    return null;
  }
}
