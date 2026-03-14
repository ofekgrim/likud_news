# Metzudat HaLikud - Design System & UI/UX Documentation

> Complete reference for the app's visual language, motion design, component library, and design workflow.

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout Grid](#4-spacing--layout-grid)
5. [Component Library](#5-component-library)
6. [Animation & Motion](#6-animation--motion)
7. [Navigation & Transitions](#7-navigation--transitions)
8. [Loading, Error & Empty States](#8-loading-error--empty-states)
9. [Gamification Design Language](#9-gamification-design-language)
10. [RTL & Localization](#10-rtl--localization)
11. [Accessibility](#11-accessibility)
12. [Admin Panel Design](#12-admin-panel-design)
13. [Design Workflow & Triggers](#13-design-workflow--triggers)
14. [Opportunities & Gaps](#14-opportunities--gaps)

---

## 1. Brand Identity

| Element | Value |
|---------|-------|
| **App Name** | מצודת הליכוד (Metzudat HaLikud) |
| **Tagline** | מלוכדים (United) |
| **Logo** | Fortress + Menorah SVG icon (`fortress_icon.svg`) |
| **Primary Font** | Heebo (Hebrew-optimized sans-serif from Google Fonts) |
| **Design Language** | Material 3 + Glassmorphism accents |
| **Direction** | RTL-first (Hebrew primary, English + Arabic secondary) |

### Floating Logo (App Bar)
- Pill-shaped container (`borderRadius = height / 2`)
- Gradient background: `#00C4F5` → `#0068A0`
- SVG fortress icon at `height × 0.72`
- "מלוכדים" text at `height × 0.32`, weight W700, white
- Shadow: dark blue at 0.2 alpha
- Default height: **44dp**

---

## 2. Color System

### 2.1 Core Brand Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `likudBlue` | `#0077B0` | Primary brand (darkened from #0099DB for WCAG AA 4.6:1) |
| `likudDarkBlue` | `#1E3A8A` | Secondary, sidebar gradients |
| `likudLightBlue` | `#E0F2FE` | Light accent backgrounds |
| `breakingRed` | `#DC2626` | Breaking news, urgent actions |
| `success` | `#16A34A` | Success states |
| `warning` | `#F59E0B` | Warning states |

### 2.2 Neutral Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimary` | `#1E293B` | Headlines, body text |
| `textSecondary` | `#5B6B80` | Captions, metadata (WCAG AA 4.7:1) |
| `textTertiary` | `#6B7A8D` | Tertiary text (WCAG AA 4.6:1) |
| `surfaceLight` | `#F8FAFC` | Light gray background |
| `surfaceMedium` | `#F1F5F9` | Medium gray sections |
| `border` | `#E2E8F0` | Dividers, card borders |

### 2.3 Light Theme

| Surface | Value |
|---------|-------|
| Background | `#FFFFFF` |
| Card surface | `#FFFFFF` |
| Scaffold | `#FFFFFF` |
| AppBar | White with 0 elevation |

### 2.4 Dark Theme

| Surface | Value |
|---------|-------|
| Background | `#121212` |
| Card surface | `#2C2C2C` |
| Surface | `#1E1E1E` |
| Text primary | `#E8E8E8` |
| Secondary accent | `#90CAF9` |

### 2.5 Theme-Aware Colors (via `context.colors`)

Accessible in Flutter via `context.colors.xxx` extension:

```
surface, surfaceVariant, surfaceMedium, background
textPrimary, textSecondary, textTertiary
border, shadow, cardSurface
likudAccentBg
glassBg, glassBorder   (for glassmorphism)
```

### 2.6 Chart Colors (Admin Panel)

```
#0099DB, #1E3A8A, #10B981, #F59E0B, #EF4444, #8B5CF6, #EC4899, #6366F1
```

---

## 3. Typography

### 3.1 Font Family

- **Heebo** (all weights: 400, 500, 600, 700, 800)
- Font files: `assets/fonts/Heebo-{Regular,Medium,Bold,ExtraBold}.ttf`

### 3.2 Type Scale (AppTypography)

| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `displayLarge` | 32px | W800 | 1.2 | Hero headlines |
| `displayMedium` | 28px | W700 | 1.25 | Large headlines |
| `displaySmall` | 24px | W700 | 1.3 | Section headers |
| `headlineLarge` | 22px | W700 | 1.3 | Major sections |
| `headlineMedium` | 20px | W600 | 1.35 | Page titles |
| `headlineSmall` | 18px | W600 | 1.4 | Subsections |
| `titleLarge` | 16px | W600 | 1.4 | Card titles |
| `titleMedium` | 14px | W500 | 1.4 | Medium labels |
| `titleSmall` | 12px | W500 | 1.4 | Small labels |
| `bodyLarge` | 16px | W400 | 1.6 | Main body text |
| `bodyMedium` | 14px | W400 | 1.5 | Secondary body |
| `bodySmall` | 12px | W400 | 1.5 | Fine print |
| `labelLarge` | 14px | W500 | 1.4 | Button labels |
| `labelMedium` | 12px | W500 | 1.4 | Badge labels |
| `labelSmall` | 10px | W500 | 1.4 | Tiny labels |

---

## 4. Spacing & Layout Grid

### 4.1 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4dp | Minimal gaps, inline spacing |
| `sm` | 8dp | Compact spacing, icon gaps |
| `md` | 12dp | Secondary spacing |
| `base` | 16dp | Standard padding, card gutter |
| `lg` | 20dp | Large spacing |
| `xl` | 24dp | Section separation |
| `2xl` | 32dp | Dialog/modal padding |

### 4.2 Card Design Tokens

| Property | Value |
|----------|-------|
| Padding | 16dp (standard) |
| Border radius | 12dp (standard), 16dp (large cards) |
| Elevation | 1-2dp (subtle), 8dp (popups) |
| Horizontal margin | 8-16dp |
| Vertical margin | 8dp |

### 4.3 Responsive Breakpoints

| Breakpoint | Condition | Effect |
|------------|-----------|--------|
| Tablet | `shortestSide >= 600` | Adapted home layout |
| Desktop (admin) | `md` (768px) | Sidebar visible |

### 4.4 Bottom Navigation Clearance

```dart
bottomPadding = MediaQuery.of(context).padding.bottom + 90dp
```

---

## 5. Component Library

### 5.1 Flutter Core Widgets (`lib/core/widgets/`)

#### AppCachedImage
Cached network image with shimmer placeholder and error fallback.
```
Props: imageUrl, width, height, borderRadius, fit
Placeholder: ShimmerLoading (shimmer effect)
Error: Broken image icon on surfaceLight background
```

#### ShimmerLoading / ShimmerArticleCard
Animated skeleton placeholder for loading states.
```
Colors: context.colors.surfaceVariant → context.colors.surface
Usage: 51 files across the app
Variants: Generic rectangle, article card skeleton
```

#### LiquidGlassContainer (Glassmorphism)
Frosted glass effect using `BackdropFilter`.
```
Blur sigma: 1-15 (default: 15)
Background opacity: 0.25 (default)
Border radius: 20dp (default)
Variants: .light(), .dark() factory methods
Border: Semi-transparent white/gray
```

#### LiquidGlassTab / LiquidGlassTabBar
Glass-effect tab bar with animated selection.
```
Transition: 200ms easeInOut
Active: likudBlue tinted background
Customizable: colors, radius, opacity
```

#### AchievementPopup
Animated overlay for badge/milestone notifications.
```
Entry: Slide from top (-1 → 0) + fade (0 → 1)
Duration: 500ms, curve: easeOutBack
Auto-dismiss: 4 seconds
Background: likudBlue gradient
Icon: 48x48 circle with 0.2 alpha white bg
Tap: Dismisses immediately
```

#### TutorialOverlay
Full-screen educational overlay with step-by-step guidance.
```
Entry: Fade 400ms easeIn
Background: Black 0.7 alpha
Content: 72x72 icon circle, title, body, CTA button
Dismiss: Tap anywhere
```

#### BrandedPlaceholder
Placeholder for missing images with fortress SVG icon.
```
Background: likudBlue @ 0.08 alpha
Icon: fortress_icon.svg
Customizable size
```

#### RtlScaffold
RTL-aware app shell with standard app bar.
```
Features: Logo, notification bell, drawer icon
Theme-aware colors
FAB support
```

#### ErrorView
Reusable error display with retry.
```
Props: message, onRetry callback
Usage: BLoC error states across features
```

### 5.2 Feature-Specific Widgets

#### FeedArticleCard
```
Image: 16:9 aspect ratio, ClipRRect 12dp radius
Category badge: Colored bg, 11px text
Title: 18px bold
Subtitle: 14px secondary color
Metadata row: Author, reading time, views, comments
Status badges: Breaking (red), Sponsored (orange), Pinned (blue)
Elevation: 2dp
Margin: 16h x 8v dp
```

#### BreakingTicker
```
Height: 36dp
Background: breakingRed (#DC2626)
Badge: "מבזק" + bolt icon (dark bg 0.2 alpha)
Scroll: Continuous horizontal, ~40px/sec
Text: White, 13px, W500
Separators: Bullet characters between items
```

#### FloatingLogo
```
Shape: Pill (borderRadius = height/2)
Gradient: #00C4F5 → #0068A0
Icon: fortress SVG (72% height)
Text: "מלוכדים" (32% height, W700, white)
Shadow: Dark blue @ 0.2 alpha
```

#### PollCard
```
Voting state: AnimatedContainer with implicit transitions
Progress bars: Horizontal fill with percentage
Active state: likudBlue accent
Disabled state: gray with reduced opacity
```

---

## 6. Animation & Motion

### 6.1 Duration Standards

| Category | Duration | Usage |
|----------|----------|-------|
| **Micro** | 150ms | Admin panel: fade, scale-in |
| **Quick** | 200ms | Tab transitions, nav bar, implicit containers |
| **Standard** | 300ms | Page slide transitions, progress bars |
| **Entrance** | 400-500ms | Overlays, modals, achievement popup |
| **Continuous** | 900-1200ms | Pulse effects, streak glow, live indicator |
| **Auto-dismiss** | 4000ms | Achievement popup timeout |

### 6.2 Curve Library

| Curve | Usage |
|-------|-------|
| `Curves.easeInOut` | Most common (~60%): tab animations, containers, progress |
| `Curves.easeOutBack` | Bounce-in: achievement popup slide |
| `Curves.easeOutCubic` | Smooth deceleration: turnout gauge |
| `Curves.easeIn` | Fade-in: overlays, tutorial |
| `Curves.easeOut` | Smooth exit: dismissals |

### 6.3 Animation Inventory

| Component | Type | Duration | Curve | Details |
|-----------|------|----------|-------|---------|
| **Achievement Popup** | Slide + Fade | 500ms | easeOutBack | Offset(0,-1)→(0,0), alpha 0→1 |
| **Live Indicator** | Opacity pulse | 1200ms | easeInOut | Repeating reverse, 0.3→1.0 |
| **Streak Counter** | Scale pulse | 1200ms | easeInOut | Scale 1.0→1.15, repeating |
| **Breaking Ticker** | Horizontal scroll | Dynamic | Linear | ~40px/sec, based on content length |
| **Story Viewer** | Page transitions | 300ms | easeInOut | PageView + progress timer |
| **AI Summary Card** | Expand/collapse | 300ms | easeInOut | Height animation |
| **TTS Player Bar** | Progress | 400ms | easeInOut | Smooth progress interpolation |
| **Tutorial Overlay** | Fade | 400ms | easeIn | Full screen overlay |
| **AMA Live Pulse** | Opacity pulse | 900ms | N/A | Live session indicator |
| **Nav Bar Selection** | Scale + Color | 200ms | easeInOut | Icon 1.0→1.15, bg color change |
| **Onboarding Dots** | Width | 250ms | easeInOut | Dot width expansion on active |
| **Results Leaderboard** | Row styling | 400ms | easeInOut | Animated row highlight |
| **Turnout Gauge** | Arc sweep | 1200ms | easeOutCubic | 0%→target%, TweenAnimationBuilder |
| **Quiz Progress** | Width | 300ms | easeInOut | Progress bar fill |
| **Countdown Timer** | Custom paint | Continuous | N/A | Canvas.drawArc circular progress |

### 6.4 Gesture Interactions

| Gesture | Component | Behavior |
|---------|-----------|----------|
| **Tap** | Cards, buttons, badges | Ripple/splash via InkWell, navigate |
| **Tap** | Achievement popup | Dismiss on tap |
| **Long press** | Story Viewer | Pause story progress timer |
| **Vertical drag** | Story Viewer | Swipe-up-to-dismiss (threshold: 120px or velocity 800) |
| **Horizontal swipe** | Stories, Onboarding, Quiz | PageView page transitions |
| **Pull-to-refresh** | 34 list screens | RefreshIndicator with likudBlue accent |

### 6.5 Animation Patterns

#### Controller-Based (Complex)
```dart
// Used for: Achievement popup, Live indicator, Streak pulse, Ticker
_controller = AnimationController(vsync: this, duration: Duration(milliseconds: 500));
_animation = Tween<Offset>(begin: Offset(0, -1), end: Offset.zero)
    .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));
_controller.forward();
```

#### Implicit (Simple State Changes)
```dart
// Used for: Nav bar, Tab selection, Onboarding dots, Leaderboard rows
AnimatedContainer(
  duration: reduceMotion ? Duration.zero : Duration(milliseconds: 200),
  curve: Curves.easeInOut,
  decoration: BoxDecoration(
    color: isSelected ? AppColors.likudBlue.withValues(alpha: 0.1) : Colors.transparent,
  ),
)
```

#### TweenAnimationBuilder (Value Interpolation)
```dart
// Used for: Turnout gauge, Quiz progress bar
TweenAnimationBuilder<double>(
  tween: Tween<double>(begin: 0, end: targetValue),
  duration: Duration(milliseconds: 1200),
  curve: Curves.easeOutCubic,
  builder: (context, value, child) => /* render with animated value */,
)
```

#### Custom Paint (Canvas)
```dart
// Used for: Circular countdown timer
canvas.drawArc(
  Rect.fromCircle(center: center, radius: radius),
  -math.pi / 2,
  2 * math.pi * progress,
  false,
  progressPaint,
);
```

---

## 7. Navigation & Transitions

### 7.1 Bottom Navigation Bar

- **Type**: LiquidGlassNavBar (custom glassmorphism)
- **Tabs**: 5 branches — Home, Breaking, Video, Stories, More
- **Framework**: GoRouter + StatefulShellRoute (persistent state)
- **Glass effect**: BackdropFilter blur sigma 1, semi-transparent bg
- **Selection animation**: 200ms icon scale (1.0 → 1.15) + color change
- **Notification badge**: Red circle with unread count on bell icon

### 7.2 Page Transitions

- **Default**: Platform-specific (PredictiveBack on Android, Cupertino on iOS)
- **Modal pages**: Slide-up from bottom
- **Story viewer**: Full-screen overlay with vertical drag dismiss
- **Onboarding**: Horizontal PageView with dot indicators

### 7.3 Navigation Hierarchy

```
├── Home (ראשי)
│   ├── Feed mode toggle (Latest / For You)
│   ├── Live readers badge
│   ├── Breaking ticker
│   ├── Stories carousel
│   ├── Feed cards → Article detail
│   └── Gamification widgets
├── Breaking (מבזקים)
│   └── Breaking news list with live indicator
├── Video (וידאו)
│   └── Video player pages
├── Stories (סטוריז)
│   └── Story viewer (full-screen)
└── More (☰)
    ├── Profile / Settings
    ├── Gamification hub
    ├── Daily quiz
    ├── Community polls
    └── Election features
```

---

## 8. Loading, Error & Empty States

### 8.1 Loading States

| Pattern | Component | Usage |
|---------|-----------|-------|
| **Shimmer skeleton** | `ShimmerLoading` | Primary pattern, 51 files |
| **Shimmer article card** | `ShimmerArticleCard` | Article lists (image + text skeleton) |
| **Spinner** | `CircularProgressIndicator` | Inline loading (buttons, forms) |
| **Skeleton table** | `TableRowSkeleton` | Admin panel table loading |
| **Pulse animation** | `animate-pulse` | Admin panel card skeletons |

### 8.2 Error States

| Pattern | Component | Behavior |
|---------|-----------|----------|
| **ErrorView** | `core/widgets/error_view.dart` | Message + retry button |
| **BLoC Error state** | Feature-specific | Emitted as sealed class, consumed by BlocBuilder |
| **Snackbar** | `ScaffoldMessenger` | Transient error feedback (20 files) |

### 8.3 Empty States

| Context | Display |
|---------|---------|
| Feed empty | Centered message with refresh hint |
| AMA empty | "Be first to ask" prompt |
| Search empty | No results illustration |
| Comments empty | Invite to comment |

---

## 9. Gamification Design Language

### 9.1 Tier System Visual Identity

| Tier | Name | Color | Icon |
|------|------|-------|------|
| 0 | Activist (פעיל) | `#0077B0` (likudBlue) | `person` |
| 1 | Leader (מוביל) | `#16A34A` (green) | `military_tech` |
| 2 | Ambassador (שגריר) | `#7C3AED` (purple) | `public` |
| 3 | General (אלוף) | `#DC2626` (red) | `shield` |
| 4 | Lion (אריה) | `#D97706` (amber) | `emoji_events` |

### 9.2 Tier Badge Widget
```
Icon: 48x48 in gradient circle
Name + description text
Level badge: "2/5" overlay
Progress bar: LinearProgressIndicator to next tier
Max indicator: Special styling at tier 5
```

### 9.3 Streak Counter Widget

**Full version:**
- 52x52 fire icon in colored container
- Streak number badge (gradient: orange/red based on risk state)
- Info text row below
- Tappable → navigates to gamification page

**At-risk state:**
- Pulse animation: 1200ms, scale 1.0→1.15, repeating
- Red/orange gradient badge

**Completed today:**
- Green checkmark overlay
- No pulse animation

**Compact version:**
- Small fire icon + number inline

### 9.4 Achievement Popup Flow

```
Trigger → AchievementService.showBadgeEarned(name)
  → Overlay.insert(AchievementPopup)
    → SlideTransition(0,-1)→(0,0) + FadeTransition 0→1 [500ms]
      → Auto-dismiss Timer [4 seconds]
        → Reverse animation → Overlay.remove()
```

### 9.5 Engagement Score

Weighted scoring stored on `app_users.engagementScore`:
- Article views, shares, comments
- Mission completions
- Quiz participation
- Poll voting
- Streak maintenance

---

## 10. RTL & Localization

### 10.1 RTL Rules

| Rule | Implementation |
|------|---------------|
| Text direction | `TextDirection.rtl` enforced globally |
| Spacing | `EdgeInsetsDirectional` (start/end, NEVER left/right) |
| Positioning | `PositionedDirectional` (start/end) |
| Icons | Material icons are direction-aware |
| Scrolling | Natural RTL flow in Rows |
| Admin panel | `dir="rtl"` on root containers |

### 10.2 Localization Files

| File | Language | Priority |
|------|----------|----------|
| `assets/l10n/he.json` | Hebrew | Primary (write first) |
| `assets/l10n/en.json` | English | Secondary |
| `assets/l10n/ar.json` | Arabic | Tertiary |

### 10.3 Localization Usage

```dart
// Import with TextDirection hide to avoid conflicts
import 'package:easy_localization/easy_localization.dart' hide TextDirection;

// Usage — removes 'const' from parent widget
Text('key'.tr())
```

---

## 11. Accessibility

### 11.1 Motion Preferences

All custom animations respect `MediaQuery.of(context).disableAnimations`:

```dart
final reduceMotion = MediaQuery.of(context).disableAnimations;
duration: reduceMotion ? Duration.zero : Duration(milliseconds: 200),
```

**Files with motion checks (6):**
- Story Viewer
- Breaking Ticker
- Live Indicator
- TTS Player Bar
- Tutorial Overlay
- Liquid Glass Nav Bar

### 11.2 Contrast Ratios (WCAG AA)

| Element | Ratio | Status |
|---------|-------|--------|
| Primary brand on white | 4.6:1 | AA Pass |
| textSecondary on white | 4.7:1 | AA Pass |
| textTertiary on white | 4.6:1 | AA Pass |
| White on breakingRed | 4.5:1 | AA Pass |

### 11.3 Semantic Markup

- Widgets use `Semantics(button:, image:, label:)` for screen readers
- `excludeSemantics` where appropriate (decorative images)
- Badge counts announced to accessibility tools
- `AppCachedImage` has semantic accessibility support

---

## 12. Admin Panel Design

### 12.1 Stack

- Next.js 15 (App Router) + React 19
- shadcn/ui (12 components)
- Tailwind CSS 3.4 + tailwindcss-animate
- Recharts for data visualization
- TipTap for RTL rich text editing
- Lucide React for icons

### 12.2 Layout Structure

```
┌─────────────────────────────────────────────┐
│ Header (56px) — hamburger, page name, user  │
├──────────┬──────────────────────────────────┤
│ Sidebar  │ Main Content                     │
│ (256px)  │ (padding: 24px, bg: gray-50)     │
│          │                                  │
│ Gradient:│                                  │
│ #1E3A8A  │                                  │
│ → #162d6e│                                  │
│          │                                  │
│ 8 nav    │                                  │
│ groups   │                                  │
│ 50+ links│                                  │
└──────────┴──────────────────────────────────┘
```

### 12.3 shadcn/ui Components

| Component | Variants |
|-----------|----------|
| **Button** | default, destructive, outline, ghost, link, secondary; sizes: sm, default, lg, icon |
| **Card** | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| **Input** | Focus ring: likudBlue/30 |
| **Textarea** | Min-height 80px |
| **Select** | HTML dropdown |
| **Badge** | default, secondary, success, warning, destructive, outline |
| **Dialog** | Overlay + escape key + confirm variant |
| **Switch** | Checked state with color animation |
| **Table** | Full suite: Header, Body, Footer, Head, Row, Cell |
| **Skeleton** | Generic, TableRowSkeleton, CardSkeleton |
| **ConfirmDialog** | Hebrew labels: "אישור" / "ביטול" |
| **Label** | Form label |

### 12.4 Admin Animations

| Animation | Duration | Curve | Usage |
|-----------|----------|-------|-------|
| `fade-in` | 150ms | ease-out | Modal/overlay entrance |
| `fade-out` | 150ms | ease-in | Modal/overlay exit |
| `scale-in` | 150ms | ease-out | Dialog content pop-in |
| `slide-in-right` | 200ms | ease-out | Mobile sidebar |
| `pulse` | Tailwind default | N/A | Loading skeletons |
| `spin` | Tailwind default | N/A | Loading spinner |

### 12.5 Admin TipTap Editor

- Direction: RTL
- Min height: 300px
- Headings: h1 (2xl), h2 (xl), h3 (lg) with proper spacing
- Lists: Right-padded for RTL
- Blockquote: Right border, italic, gray
- Links: #0099DB with underline
- Images: max-width, rounded-lg

---

## 13. Design Workflow & Triggers

### 13.1 User Action → Visual Feedback Loop

```
User Action          Trigger                    Visual Response
─────────────────────────────────────────────────────────────────
Tap article card  →  Navigate                →  Platform page transition
Pull down feed    →  RefreshIndicator        →  Blue spinner → shimmer reload
Vote on poll      →  BLoC event              →  AnimatedContainer fill bar
Complete mission  →  BLoC → AchievementSvc   →  Achievement popup (slide+fade)
Earn badge        →  AchievementService      →  Gold popup with badge name
Streak milestone  →  AchievementService      →  Fire emoji popup
Tier promotion    →  AchievementService      →  Green arrow popup
Read article      →  Analytics track         →  Live readers badge updates
Open breaking     →  SSE connection          →  Live indicator pulse starts
View story        →  Story viewer            →  Progress bar + long-press pause
Switch feed mode  →  ChangeFeedMode event    →  Tab highlight animation + reload
Error occurs      →  BLoC error state        →  ErrorView with retry button
Network slow      →  Loading state           →  Shimmer skeletons
```

### 13.2 Gamification Trigger Chain

```
User Activity
  │
  ├─ Article read ─────── +10 points ──┐
  ├─ Article share ────── +25 points   │
  ├─ Comment posted ───── +15 points   ├─► Engagement Score Update
  ├─ Poll voted ───────── +10 points   │       │
  ├─ Quiz completed ───── +20 points   │       ├─► Tier Check
  ├─ Daily mission done ─ +30 points ──┘       │     └─► Tier Promotion Popup
  │                                             │
  └─ Daily login ───────── Streak +1            ├─► Badge Check
                              │                 │     └─► Badge Earned Popup
                              ├─► 7-day  ───────┤
                              ├─► 30-day ───────┤     Streak Milestone Popup
                              └─► 100-day ──────┘
```

### 13.3 Real-Time Update Triggers

| Trigger | Source | UI Response |
|---------|--------|-------------|
| Breaking news | SSE stream | Ticker scrolls, live indicator pulses |
| Live readers count | Polling (60s) | Badge count updates |
| Push notification | FCM | System notification → deep link |
| Article published | Admin panel | Feed refresh on next pull |
| Election results | Redis PubSub | Results page live update |

### 13.4 Admin Panel Workflow

```
Content Creation:
  Admin logs in → Dashboard overview
    → New Article → TipTap editor (RTL) → Preview → Publish
    → Push notification → Template selection → Audience → Send

Analytics Review:
  Article Analytics → Period toggle → Stat cards + trend chart + referrer pie
  Growth Analytics → DAU/WAU/MAU cards + growth trend + funnel + retention cohorts

User Management:
  App Users → Search/filter → User detail → Approve/reject membership
```

---

## 14. Opportunities & Gaps

### 14.1 Currently Implemented

- [x] Material 3 theming with light/dark modes
- [x] Complete type scale (14 levels)
- [x] WCAG AA contrast compliance
- [x] Glassmorphism nav bar and containers
- [x] Shimmer loading across 51 files
- [x] Pull-to-refresh across 34 screens
- [x] Achievement popup system
- [x] 15+ distinct animations
- [x] Motion accessibility (disableAnimations)
- [x] Full RTL support
- [x] 3-language localization (he/en/ar)
- [x] 5 gamification tiers with visual identity
- [x] Engagement funnel analytics
- [x] Retention cohort tracking

### 14.2 Enhancement Opportunities

| Area | Current | Enhancement |
|------|---------|-------------|
| **Hero animations** | 1 usage (tier badge) | Add to article cards, member avatars, media |
| **Staggered list animations** | Not implemented | Add flutter_staggered_animations for list entries |
| **Lottie/Rive** | Not installed | Add for celebration effects, onboarding illustrations |
| **Haptic feedback** | Not used | Add HapticFeedback for votes, achievements, streaks |
| **Shared element transitions** | None | Add for feed → article detail image transition |
| **Skeleton variants** | 2 variants | Add per-feature skeletons (poll card, video card, etc.) |
| **Micro-interactions** | Basic | Add button press scale, like heart animation |
| **Page transitions** | Platform default | Custom fade/slide for feature sections |
| **Confetti/celebration** | None | Add for tier promotion, 100-day streak |
| **Bottom sheets** | Standard modal | Custom glassmorphism bottom sheets |
| **Dark mode polish** | Defined but basic | Refine dark mode contrast and imagery |
| **Tablet layout** | Basic breakpoint check | Multi-column feed, split-view article detail |

---

## File Reference

### Flutter Design Files
| File | Purpose |
|------|---------|
| `lib/app/theme/app_colors.dart` | Color constants |
| `lib/app/theme/app_typography.dart` | Type scale |
| `lib/app/theme/app_theme.dart` | ThemeData (light + dark) |
| `lib/app/theme/app_colors_extension.dart` | Theme-aware color extension |
| `lib/app/theme/theme_context.dart` | `context.colors` helper |
| `lib/app/widgets/liquid_glass_nav_bar.dart` | Bottom navigation |
| `lib/core/widgets/achievement_popup.dart` | Achievement overlay |
| `lib/core/widgets/shimmer_loading.dart` | Shimmer skeletons |
| `lib/core/widgets/liquid_glass_container.dart` | Glassmorphism container |
| `lib/core/widgets/tutorial_overlay.dart` | Tutorial overlay |
| `lib/core/widgets/error_view.dart` | Error display |
| `lib/core/services/achievement_service.dart` | Achievement trigger service |

### Admin Design Files
| File | Purpose |
|------|---------|
| `admin/tailwind.config.ts` | Theme: colors, fonts, animations |
| `admin/src/app/globals.css` | Global styles, scrollbar, editor |
| `admin/src/components/ui/` | 12 shadcn/ui components |
| `admin/src/components/sidebar.tsx` | Navigation (8 groups, 50+ items) |
| `admin/src/components/header.tsx` | Top bar |
