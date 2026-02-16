import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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
                builder: (context, state) =>
                    const _PlaceholderPage(title: 'ראשי - Home'),
              ),
            ],
          ),
          // Tab 2: Breaking News (מבזקים)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/breaking',
                builder: (context, state) =>
                    const _PlaceholderPage(title: 'מבזקים - Breaking'),
              ),
            ],
          ),
          // Tab 3: Video (וידאו)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/video',
                builder: (context, state) =>
                    const _PlaceholderPage(title: 'וידאו - Video'),
              ),
            ],
          ),
          // Tab 4: Magazine (מגזין)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/magazine',
                builder: (context, state) =>
                    const _PlaceholderPage(title: 'מגזין - Magazine'),
              ),
            ],
          ),
          // Tab 5: More (☰)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/more',
                builder: (context, state) =>
                    const _PlaceholderPage(title: '☰ More'),
              ),
            ],
          ),
        ],
      ),

      // Full-screen routes (outside tab shell)
      GoRoute(
        path: '/article/:slug',
        builder: (context, state) => _PlaceholderPage(
          title: 'Article: ${state.pathParameters['slug']}',
        ),
      ),
      GoRoute(
        path: '/member/:id',
        builder: (context, state) => _PlaceholderPage(
          title: 'Member: ${state.pathParameters['id']}',
        ),
      ),
      GoRoute(
        path: '/search',
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Search'),
      ),
      GoRoute(
        path: '/categories',
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Categories'),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Settings'),
      ),
      GoRoute(
        path: '/favorites',
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Favorites'),
      ),
      GoRoute(
        path: '/contact',
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Contact'),
      ),
      GoRoute(
        path: '/about',
        builder: (context, state) =>
            const _PlaceholderPage(title: 'About'),
      ),
      GoRoute(
        path: '/accessibility',
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Accessibility'),
      ),
      GoRoute(
        path: '/privacy',
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Privacy Policy'),
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
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'ראשי',
          ),
          NavigationDestination(
            icon: Icon(Icons.flash_on_outlined),
            selectedIcon: Icon(Icons.flash_on),
            label: 'מבזקים',
          ),
          NavigationDestination(
            icon: Icon(Icons.play_circle_outline),
            selectedIcon: Icon(Icons.play_circle),
            label: 'וידאו',
          ),
          NavigationDestination(
            icon: Icon(Icons.article_outlined),
            selectedIcon: Icon(Icons.article),
            label: 'מגזין',
          ),
          NavigationDestination(
            icon: Icon(Icons.menu),
            selectedIcon: Icon(Icons.menu),
            label: 'עוד',
          ),
        ],
      ),
    );
  }
}

/// Placeholder page for screens not yet implemented.
class _PlaceholderPage extends StatelessWidget {
  final String title;

  const _PlaceholderPage({required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Text(
          title,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
      ),
    );
  }
}
