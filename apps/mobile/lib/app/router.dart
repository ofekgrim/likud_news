import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// Feature page imports
import '../features/home/presentation/pages/home_page.dart';
import '../features/breaking_news/presentation/pages/breaking_news_page.dart';
import '../features/video/presentation/pages/video_page.dart';
import '../features/magazine/presentation/pages/magazine_page.dart';
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

/// App router configuration using GoRouter.
///
/// Uses StatefulShellRoute for persistent bottom tab navigation
/// across 5 main tabs: Home, Breaking, Video, Magazine, More.
class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
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
                builder: (context, state) => const HomePage(),
              ),
            ],
          ),
          // Tab 2: Breaking News (מבזקים)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/breaking',
                builder: (context, state) => const BreakingNewsPage(),
              ),
            ],
          ),
          // Tab 3: Video (וידאו)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/video',
                builder: (context, state) => const VideoPage(),
              ),
            ],
          ),
          // Tab 4: Magazine (מגזין)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/magazine',
                builder: (context, state) => const MagazinePage(),
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
        builder: (context, state) => ArticleDetailPage(
          slug: state.pathParameters['slug']!,
        ),
      ),
      GoRoute(
        path: '/member/:id',
        builder: (context, state) => MemberDetailPage(
          memberId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/members',
        builder: (context, state) => const MembersPage(),
      ),
      GoRoute(
        path: '/search',
        builder: (context, state) => const SearchPage(),
      ),
      GoRoute(
        path: '/categories',
        builder: (context, state) => const CategoriesPage(),
      ),
      GoRoute(
        path: '/category/:slug',
        builder: (context, state) => CategoryArticlesPage(
          slug: state.pathParameters['slug']!,
          name: state.uri.queryParameters['name'] ?? '',
        ),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsPage(),
      ),
      GoRoute(
        path: '/favorites',
        builder: (context, state) => const FavoritesPage(),
      ),
      GoRoute(
        path: '/contact',
        builder: (context, state) => const ContactPage(),
      ),
      GoRoute(
        path: '/about',
        builder: (context, state) => const AboutPage(),
      ),
      GoRoute(
        path: '/accessibility',
        builder: (context, state) => const AccessibilityPage(),
      ),
      GoRoute(
        path: '/privacy',
        builder: (context, state) => const PrivacyPage(),
      ),
    ],
  );
}

/// Main shell widget with bottom navigation bar.
class _MainShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const _MainShell({required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) {
          navigationShell.goBranch(
            index,
            initialLocation: index == navigationShell.currentIndex,
          );
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home),
            label: 'home'.tr(),
          ),
          NavigationDestination(
            icon: const Icon(Icons.flash_on_outlined),
            selectedIcon: const Icon(Icons.flash_on),
            label: 'breaking_news'.tr(),
          ),
          NavigationDestination(
            icon: const Icon(Icons.play_circle_outline),
            selectedIcon: const Icon(Icons.play_circle),
            label: 'video'.tr(),
          ),
          NavigationDestination(
            icon: const Icon(Icons.article_outlined),
            selectedIcon: const Icon(Icons.article),
            label: 'magazine'.tr(),
          ),
          NavigationDestination(
            icon: const Icon(Icons.menu),
            selectedIcon: const Icon(Icons.menu),
            label: 'more'.tr(),
          ),
        ],
      ),
    );
  }
}
