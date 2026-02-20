# Fix: YouTube Error 152-4 + Full Twitter/X Embed

## Context

Phase 13 is complete (video blocks, related/recommended articles). Two runtime bugs were discovered:

1. **YouTube inline player error 152-4** — When tapping a YouTube VideoBlock to play inline, `youtube_player_iframe` shows "This video is unavailable, Error code: 152-4". The `YoutubePlayerParams` are missing critical settings (`origin`, `playsInline`).

2. **Twitter/X embed only shows @handle + link** — The `TweetEmbedWidget` renders a basic card with just the username and "View on X" button. The user wants the full tweet rendered (profile pic, text, media, timestamp, engagement) like in the Kan News reference app.

Additionally, the seed data uses a fake tweet ID (`1234567890123456789`) which needs a real one for testing.

---

## Implementation Plan

### Step 1: Fix YouTube inline player (1 file)

**File**: `apps/mobile/lib/features/article_detail/presentation/widgets/video_player_widget.dart`

**Changes**:
- Add `import 'package:url_launcher/url_launcher.dart';`
- Fix `YoutubePlayerParams` in `_startYouTube()` — add `origin: 'https://www.youtube.com'`, `playsInline: true`, `strictRelatedVideos: true`, `enableCaption: false`
- Add `_openYouTubeExternal()` fallback method that opens in YouTube app/browser
- Add small "open external" button overlay on the inline player (top-left corner) as escape hatch
- Wrap controller creation in try-catch, fallback to external on failure

### Step 2: Add `webview_flutter` dependency (1 file)

**File**: `apps/mobile/pubspec.yaml`

**Change**: Add `webview_flutter: ^4.10.0` under the Media dependencies section (already a transitive dep of `youtube_player_iframe`, now explicit).

Run `flutter pub get`.

### Step 3: Rewrite tweet embed with WebView (1 file)

**File**: `apps/mobile/lib/features/article_detail/presentation/widgets/tweet_embed_widget.dart`

**Complete rewrite** (~200 lines). New approach:
- `StatefulWidget` with `WebViewController`
- Loads HTML containing Twitter's embed blockquote + `widgets.js` script
- HTML uses `dir="rtl" lang="he"`, `data-lang="he"`, `data-dnt="true"`
- JavaScript channel `TweetHeight` reports rendered height back to Flutter
- Two height-detection mechanisms: `twttr.events.bind('rendered')` + polling fallback from `onPageFinished`
- `NavigationDelegate` whitelists Twitter CDN domains, opens all other URLs externally
- 10-second timeout → falls back to current static card UI
- `ShimmerLoading` overlay during load (existing widget at `core/widgets/shimmer_loading.dart`)
- `_buildFallbackCard()` preserves exact current card design as graceful degradation

### Step 4: Fix seed tweet ID (1 file)

**File**: `backend/src/database/seeds/seed.ts`

**Change**: Replace fake `tweetId: '1234567890123456789'` with a real public tweet ID for testing.

### Step 5: Verify

- `flutter pub get`
- `flutter analyze` — 0 errors
- `flutter test` — all pass
- Manual: open article → YouTube video plays inline without 152-4 error
- Manual: tweet block renders full tweet with media/engagement

---

## Key Files

| File | Action | Lines |
|------|--------|-------|
| `apps/mobile/lib/features/article_detail/presentation/widgets/video_player_widget.dart` | MODIFY | ~+30 |
| `apps/mobile/pubspec.yaml` | MODIFY | +1 line |
| `apps/mobile/lib/features/article_detail/presentation/widgets/tweet_embed_widget.dart` | REWRITE | ~200 |
| `backend/src/database/seeds/seed.ts` | MODIFY | 1 line |

**No changes needed**: Info.plist, AndroidManifest, content_block.dart, block_renderer.dart, domain entities
