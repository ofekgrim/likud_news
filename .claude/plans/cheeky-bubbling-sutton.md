# Home Category Grid, 10-Article Pagination, Breaking News "All Articles" Fix

## Context

The home page currently shows: ticker → hero → stories → date → "חדשות אחרונות" header → infinite-scroll feed (20 articles/page). The user wants:

1. **Category grid on home page** — below "חדשות אחרונות", users can tap a category to navigate to its article list
2. **10-article pagination with "show more" button** — replace infinite scroll with 10 articles + explicit load-more button
3. **Fix מבזקים "לכל הכתבות" tab** — currently both tabs show data from `/articles/breaking`; the "all articles" tab should fetch ALL published articles from `/articles`

---

## Part A: Home Page — Category Grid

Add a 2-column category grid (reusing existing `CategoryCard` widget) after the "חדשות אחרונות" header and before the feed articles. Categories are already loaded in `HomeLoaded.categories`.

| # | File | Action | Details |
|---|------|--------|---------|
| 1 | `apps/mobile/lib/features/home/presentation/pages/home_page.dart` | MODIFY | Insert a "categories" section header `SliverToBoxAdapter` + a `SliverGrid` of `CategoryCard` widgets between the "latest_news" header and the feed `SliverList`. Grid: 2 columns, aspect ratio ~1.2, 12px spacing, 16px padding. Tap navigates to `/category/${category.slug}?name=${category.name}`. Import `CategoryCard` from `categories/presentation/widgets/category_card.dart` |
| 2 | `apps/mobile/assets/l10n/he.json` | MODIFY | Add key `"browse_categories": "עיון לפי קטגוריה"` |
| 3 | `apps/mobile/assets/l10n/en.json` | MODIFY | Add key `"browse_categories": "Browse by Category"` |

**Reuse:** `CategoryCard` widget at `apps/mobile/lib/features/categories/presentation/widgets/category_card.dart` — already handles color accent, icon, name display, and tap callback.

---

## Part B: Home Page — 10 Articles + "Show More" Button

Replace the infinite-scroll auto-loading with a page size of 10 and an explicit "show more" button.

| # | File | Action | Details |
|---|------|--------|---------|
| 4 | `apps/mobile/lib/features/home/domain/usecases/get_feed_articles.dart` | MODIFY | Add `limit` field to `FeedParams` (default 10): `const FeedParams({required this.page, this.limit = 10})`. Add to `props` |
| 5 | `apps/mobile/lib/features/home/domain/repositories/home_repository.dart` | MODIFY | Add `limit` param: `getFeedArticles({required int page, int limit = 10})` |
| 6 | `apps/mobile/lib/features/home/data/repositories/home_repository_impl.dart` | MODIFY | Pass `limit` through to datasource |
| 7 | `apps/mobile/lib/features/home/data/datasources/home_remote_datasource.dart` | MODIFY | Add `limit` param to `getFeedArticles`. Pass as query param: `queryParameters: {'page': page, 'limit': limit}` |
| 8 | `apps/mobile/lib/features/home/presentation/bloc/home_bloc.dart` | MODIFY | Change `_pageSize` from 20 to 10. Pass `limit: _pageSize` when constructing `FeedParams` |
| 9 | `apps/mobile/lib/features/home/presentation/pages/home_page.dart` | MODIFY | Remove `_scrollController` scroll listener for auto-load. Replace the trailing `CircularProgressIndicator` in `SliverList` with a "show more" button (`SliverToBoxAdapter`). Button dispatches `LoadMoreArticles()`. Hidden when `!state.hasMore` |
| 10 | `apps/mobile/assets/l10n/he.json` | MODIFY | Add key `"show_more": "הצג עוד"` |
| 11 | `apps/mobile/assets/l10n/en.json` | MODIFY | Add key `"show_more": "Show More"` |
| 12 | `apps/mobile/test/features/home/presentation/bloc/home_bloc_test.dart` | MODIFY | Update `FeedParams` assertions to include `limit: 10`. Update "hasMore true" test to generate 10 articles instead of 20 |

---

## Part C: Breaking News — "לכל הכתבות" Shows All Published Articles

The "all articles" tab currently filters the same `/articles/breaking` response. Refactor it to fetch from `GET /articles?status=published` with its own pagination.

### C1: Data layer — add `getAllArticles` method

| # | File | Action | Details |
|---|------|--------|---------|
| 13 | `apps/mobile/lib/features/breaking_news/data/datasources/breaking_news_remote_datasource.dart` | MODIFY | Add `Future<List<Article>> getAllArticles({int page, int limit})` to abstract class + impl. Calls `GET /articles?page=$page&limit=$limit&status=published`. Uses existing `_articleFromJson` mapper. Parses `data['data']` or raw list |
| 14 | `apps/mobile/lib/features/breaking_news/domain/repositories/breaking_news_repository.dart` | MODIFY | Add `Future<Either<Failure, List<Article>>> getAllArticles({int page, int limit})` |
| 15 | `apps/mobile/lib/features/breaking_news/data/repositories/breaking_news_repository_impl.dart` | MODIFY | Implement `getAllArticles` — wraps datasource call in try/catch, maps `ServerException` → `ServerFailure` |
| 16 | `apps/mobile/lib/features/breaking_news/domain/usecases/get_all_articles.dart` | NEW | `GetAllArticles` use case with `AllArticlesParams(page, limit)`. Returns `Either<Failure, List<Article>>` |

### C2: BLoC — manage two separate article lists

| # | File | Action | Details |
|---|------|--------|---------|
| 17 | `apps/mobile/lib/features/breaking_news/presentation/bloc/breaking_news_bloc.dart` | MODIFY | **Events:** Add `LoadAllArticles`, `LoadMoreAllArticles`. **State:** Expand `BreakingNewsLoaded` with `allArticles` (List), `allArticlesPage` (int), `allArticlesHasMore` (bool). **Handlers:** `_onLoadAllArticles` fetches page 1 from `GetAllArticles`; `_onLoadMoreAllArticles` appends next page. Inject `GetAllArticles` as 3rd constructor param. Page size = 10 |

### C3: Presentation — wire the "all articles" tab

| # | File | Action | Details |
|---|------|--------|---------|
| 18 | `apps/mobile/lib/features/breaking_news/presentation/pages/breaking_news_page.dart` | MODIFY | Add `TabController` listener — when tab switches to index 1, dispatch `LoadAllArticles` (only first time). Replace `_BreakingList(breakingOnly: false)` with a new `_AllArticlesList` widget that reads `state.allArticles`, shows shimmer while `allArticles` is empty and loading, and has a "show more" button at the bottom |

### C4: DI wiring

| # | File | Action | Details |
|---|------|--------|---------|
| 19 | — | RUN | `dart run build_runner build --delete-conflicting-outputs` to register `GetAllArticles` |

### C5: i18n

| # | File | Action | Details |
|---|------|--------|---------|
| 20 | `apps/mobile/assets/l10n/he.json` | MODIFY | Add: `"no_all_articles": "אין כתבות להצגה"` |
| 21 | `apps/mobile/assets/l10n/en.json` | MODIFY | Add: `"no_all_articles": "No articles to display"` |

---

## Files Summary

**Modified (13):**
- `apps/mobile/lib/features/home/presentation/pages/home_page.dart`
- `apps/mobile/lib/features/home/presentation/bloc/home_bloc.dart`
- `apps/mobile/lib/features/home/domain/usecases/get_feed_articles.dart`
- `apps/mobile/lib/features/home/domain/repositories/home_repository.dart`
- `apps/mobile/lib/features/home/data/repositories/home_repository_impl.dart`
- `apps/mobile/lib/features/home/data/datasources/home_remote_datasource.dart`
- `apps/mobile/lib/features/breaking_news/data/datasources/breaking_news_remote_datasource.dart`
- `apps/mobile/lib/features/breaking_news/domain/repositories/breaking_news_repository.dart`
- `apps/mobile/lib/features/breaking_news/data/repositories/breaking_news_repository_impl.dart`
- `apps/mobile/lib/features/breaking_news/presentation/bloc/breaking_news_bloc.dart`
- `apps/mobile/lib/features/breaking_news/presentation/pages/breaking_news_page.dart`
- `apps/mobile/assets/l10n/he.json`
- `apps/mobile/assets/l10n/en.json`

**New (1):**
- `apps/mobile/lib/features/breaking_news/domain/usecases/get_all_articles.dart`

**Test updates (1):**
- `apps/mobile/test/features/home/presentation/bloc/home_bloc_test.dart`

---

## Execution Order

```
Part A + B (home page changes) — 1 agent
    ↓
Part C (breaking news refactor) — 1 agent (parallel with A+B if no conflicts)
    ↓
build_runner + flutter analyze + flutter test
```

---

## Verification

1. `flutter analyze` — 0 errors
2. `flutter test` — all tests pass
3. Home page: categories grid visible below "חדשות אחרונות", tapping navigates to `/category/:slug`
4. Home page: only 10 articles shown initially, "show more" button loads 10 more
5. Breaking news: "מבזקים" tab shows only breaking articles (from `/articles/breaking`)
6. Breaking news: "לכל הכתבות" tab shows all published articles (from `/articles`), with "show more" pagination
