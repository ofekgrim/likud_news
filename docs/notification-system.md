# Notification System — Metzudat HaLikud

## Architecture Overview

The notification system spans all three layers of the monorepo:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Admin Panel    │     │   NestJS Backend │     │   Flutter App   │
│   (Next.js 15)   │────▶│   (Port 9090)    │────▶│   (iOS/Android) │
│                  │     │                  │     │                  │
│ • Send UI        │     │ • FCM via Admin  │     │ • Receive push   │
│ • Templates      │     │ • Token mgmt     │     │ • Inbox UI       │
│ • Analytics      │     │ • Audience rules  │     │ • Badge counter  │
│ • Scheduling     │     │ • Track opens     │     │ • Deep linking   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 1. Backend (NestJS)

### Modules

#### Push Module (`backend/src/modules/push/`)
Handles FCM token registration and low-level Firebase messaging.

| File | Purpose |
|------|---------|
| `push.service.ts` | Token CRUD, `sendToAll()`, stale token detection, `pruneStaleTokens()` |
| `push.controller.ts` | `POST /push/register` (public), `POST /push/send` (admin) |
| `firebase-admin.provider.ts` | Firebase Admin SDK init with env vars, legacy HTTP transport |
| `entities/push-token.entity.ts` | `PushToken` entity (deviceId, token, platform, isActive, timestamps) |
| `dto/register-token.dto.ts` | Validation for token registration |
| `dto/send-notification.dto.ts` | Validation for sending notifications |

#### Notifications Module (`backend/src/modules/notifications/`)
High-level notification orchestration: templates, audience targeting, scheduling, analytics.

| File | Purpose |
|------|---------|
| `notifications.service.ts` | `send()`, `executeSend()`, `sendToTokens()`, `triggerContentNotification()`, `trackOpen()`, `getInbox()`, `getUnreadCount()` |
| `notifications.controller.ts` | Public: inbox, unread-count, track-open. Admin: send, logs, cancel |
| `notification-template.service.ts` | Template CRUD with variable substitution (`{{article_title}}`) |
| `notification-audience.service.ts` | Audience resolution from targeting rules |
| `entities/notification-log.entity.ts` | Notification log (title, body, audience, delivery stats) |
| `entities/notification-receipt.entity.ts` | Per-device receipt (sent/delivered/opened/failed) |

### API Endpoints

#### Public (no auth required)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/push/register` | Register FCM token for a device |
| `GET` | `/api/v1/notifications/inbox?deviceId=...&page=1&limit=20` | Get notification inbox |
| `GET` | `/api/v1/notifications/inbox/unread-count?deviceId=...` | Get unread badge count |
| `POST` | `/api/v1/notifications/track-open` | Track notification open (logId + deviceId) |

#### Admin (JWT + roles: EDITOR, ADMIN, SUPER_ADMIN)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/notifications/send` | Send notification with audience targeting |
| `POST` | `/api/v1/notifications/send/preview-audience` | Preview audience size |
| `GET` | `/api/v1/notifications/logs` | List sent notifications with filters |
| `GET` | `/api/v1/notifications/logs/:id` | Get single log with delivery stats |
| `PATCH` | `/api/v1/notifications/logs/:id/cancel` | Cancel pending notification |

### FCM Message Structure

```typescript
{
  notification: { title, body, imageUrl },
  data: {
    notificationLogId: "uuid",     // For open tracking
    contentType: "article|poll|event|election|quiz|custom",
    contentId: "uuid",
    articleSlug: "slug-string",     // camelCase for Flutter
  },
  apns: { payload: { aps: { sound: "default", badge: 1 } } },
  android: { priority: "high", notification: { sound: "default", channelId: "breaking_news" } },
  tokens: ["fcm-token-1", "fcm-token-2", ...]
}
```

### FCM Best Practices Implemented
- **Batch sending**: 500 tokens per batch with 1500ms delay between batches
- **Stale token detection**: Deactivates tokens on `registration-token-not-registered` or `invalid-registration-token` errors
- **Stale token pruning**: `pruneStaleTokens(30)` deactivates tokens not updated in 30+ days
- **Legacy HTTP transport**: `enableLegacyHttpTransport()` to avoid HTTP/2 connection issues
- **Token freshness**: `updatedAt` column auto-updated on every re-registration

### Auto-trigger Notifications
When an article is published, the backend automatically:
1. Finds templates matching `article.published` trigger event
2. Resolves template variables with article context (`article_title`, `article_slug`)
3. Sends to all matching audience

---

## 2. Flutter Mobile App

### Push Notification Service (`apps/mobile/lib/core/services/push_notification_service.dart`)

#### Initialization Flow
```
1. Request permission (alert, badge, sound)
2. iOS: Set foreground presentation options (alert, badge, sound)
3. iOS: Wait for APNS token (2 attempts, 3s delay between)
4. Get FCM token
5. Register token with backend (POST /push/register)
6. Listen for token refresh → re-register
7. Init local notifications (Android channel)
8. Listen for foreground messages
9. Listen for background tap (onMessageOpenedApp)
10. Check for terminated tap (getInitialMessage)
11. Register background handler
```

#### Foreground Push Handling
- **iOS**: Native presentation via `setForegroundNotificationPresentationOptions` (alert + badge + sound)
- **Android**: Local notification via `flutter_local_notifications` on `breaking_news` channel
- **Both**: Badge counter incremented via `NotificationCountService.increment()`

#### Push Tap Handling (Background + Terminated)
1. Track open: sends `notificationLogId` + `deviceId` to `POST /notifications/track-open`
2. Navigate based on `contentType` in FCM data payload:

| contentType | Route |
|-------------|-------|
| `article` | `/article/{slug}` |
| `poll` | `/polls` |
| `event` | `/events` |
| `election` | `/election-day/{contentId}` |
| `quiz` | `/primaries/quiz` |
| `inbox` | `/notifications` |

#### Local Notification Tap
Same as push tap — decodes JSON payload, tracks open, navigates.

### Notification Count Service (`apps/mobile/lib/core/services/notification_count_service.dart`)

Lightweight singleton exposing `ValueNotifier<int>` for the bell badge.

| Method | Purpose |
|--------|---------|
| `refresh()` | Fetches unread count from backend |
| `increment()` | Optimistic +1 on foreground push |
| `decrement()` | Optimistic -1 on mark-as-read |

Used by `RtlScaffold` bell icon via `ValueListenableBuilder`.

### Notification Inbox Feature (`apps/mobile/lib/features/notification_inbox/`)

Full Clean Architecture implementation:

```
notification_inbox/
├── data/
│   ├── datasources/notification_inbox_remote_datasource.dart
│   ├── models/notification_item_model.dart
│   └── repositories/notification_inbox_repository_impl.dart
├── domain/
│   ├── entities/notification_item.dart
│   ├── repositories/notification_inbox_repository.dart
│   └── usecases/
│       ├── get_notification_inbox.dart
│       └── mark_notification_opened.dart
└── presentation/
    ├── bloc/
    │   ├── notification_inbox_bloc.dart
    │   ├── notification_inbox_event.dart
    │   └── notification_inbox_state.dart
    ├── pages/notification_inbox_page.dart
    └── widgets/notification_item_card.dart
```

#### Notification Item Entity
```dart
- id: String (UUID)
- title: String
- body: String
- imageUrl: String?
- contentType: String (article, poll, event, election, quiz, custom)
- contentId: String?
- contentSlug: String? (for articles)
- status: String
- sentAt: DateTime?
- openedAt: DateTime? (null = unread)
- createdAt: DateTime
- bool get isRead => openedAt != null
```

#### Inbox Page Features
- Pull-to-refresh
- Infinite scroll pagination
- Tap: mark as read → decrement badge → navigate to content
- Empty state with Hebrew text
- Loading and error states

### Dependency Injection (`apps/mobile/lib/app/di.dart`)
```dart
// Order matters: NotificationCountService registered before PushNotificationService
NotificationCountService(apiClient, deviceIdService)
PushNotificationService(apiClient, deviceIdService, notificationCountService)
```

---

## 3. Database Schema

### push_tokens
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| deviceId | VARCHAR(200) | Unique device identifier |
| userId | UUID | Optional, FK to app_users |
| token | VARCHAR(500) | FCM registration token |
| platform | VARCHAR(20) | `ios` or `android` |
| isActive | BOOLEAN | Default true, set false on stale/invalid |
| createdAt | TIMESTAMP | Auto-set |
| updatedAt | TIMESTAMP | Auto-updated on save |

### notification_logs
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| templateId | UUID | Optional, FK to notification_templates |
| title | VARCHAR | Notification title |
| body | TEXT | Notification body |
| imageUrl | VARCHAR | Optional image |
| contentType | ENUM | article, poll, event, election, quiz, custom |
| contentId | UUID | Optional, linked content |
| data | JSONB | Context data (article_slug, etc.) |
| audienceRules | JSONB | Targeting rules |
| sentById | UUID | Admin who sent it |
| status | ENUM | pending, sending, sent, failed, cancelled |
| totalTargeted | INT | Audience size |
| totalSent | INT | Successfully sent |
| totalFailed | INT | Failed sends |
| totalOpened | INT | Unique opens |
| scheduledAt | TIMESTAMP | Optional scheduling |
| sentAt | TIMESTAMP | When actually sent |
| completedAt | TIMESTAMP | When batch completed |
| errorMessage | TEXT | Error details if failed |

### notification_receipts
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| logId | UUID | FK to notification_logs |
| pushTokenId | UUID | FK to push_tokens |
| deviceId | VARCHAR | Device that received it |
| userId | UUID | Optional authenticated user |
| status | ENUM | sent, delivered, opened, failed |
| failureReason | VARCHAR | Error message if failed |
| openedAt | TIMESTAMP | When user tapped/opened |
| createdAt | TIMESTAMP | Auto-set |

---

## 4. Firebase Configuration

### Firebase Project
- **Project ID**: `metzudat-halikud`
- **Sender ID**: `359155849868`

### iOS
- **Bundle ID**: `com.likud.news.metzudatHalikud`
- **APNs Key ID**: `W6D46AA447`
- **Team ID**: `E7NN752R9L`
- **APNs Auth Key**: Uploaded to Firebase Console (both development + production)
- **Entitlements**: `aps-environment = development` in `Runner.entitlements`

### Android
- **Package**: `com.likud.news.metzudatHalikud`
- **google-services.json**: In `apps/mobile/android/app/`

### Backend Environment Variables
```env
FIREBASE_PROJECT_ID=metzudat-halikud
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@metzudat-halikud.iam.gserviceaccount.com
```

### Flutter Config
- `apps/mobile/lib/firebase_options.dart` — Generated by `flutterfire configure`

---

## 5. API URL Configuration

```dart
// apps/mobile/lib/core/constants/api_constants.dart
static const String _devUrl = 'http://localhost:9090/api/v1';
static const String _prodUrl = 'https://misfashioned-fastidiously-deacon.ngrok-free.dev/api/v1';
static const String baseUrl = kReleaseMode ? _prodUrl : _devUrl;
```

- **Debug builds** (simulator): Use localhost:9090
- **Release builds** (TestFlight): Use ngrok URL

---

## 6. Testing & Debugging

### Simulator Push Test
```bash
xcrun simctl push <DEVICE_ID> com.likud.news.metzudatHalikud apps/mobile/test_push_payload.apns
```
Note: Only tests notification display. APNS/FCM tokens are NOT available on simulators.

### Backend Push Test Script
```bash
cd backend
npx ts-node -r tsconfig-paths/register src/database/seeds/test-push-notification.ts [optional-fcm-token]
```
Lists registered tokens, optionally registers a manual token, sends test FCM notification.

### Check Registered Tokens
```sql
SELECT id, "deviceId", platform, LEFT(token, 30) as token_prefix, "isActive", "updatedAt"
FROM push_tokens ORDER BY "updatedAt" DESC;
```

### Check Notification Delivery
```sql
SELECT l.id, l.title, l.status, l."totalTargeted", l."totalSent", l."totalFailed", l."totalOpened"
FROM notification_logs l ORDER BY l."createdAt" DESC LIMIT 10;
```

### Verify ngrok
```bash
curl -s http://localhost:4040/api/tunnels | python3 -c "import sys,json; d=json.load(sys.stdin); [print(t['public_url']) for t in d['tunnels']]"
```

---

## 7. Build History

| Build | Changes | Status |
|-------|---------|--------|
| 1 | Initial TestFlight | Rejected (missing privacy strings) |
| 2 | Added NSMicrophoneUsageDescription + location strings | Uploaded |
| 3 | Switched to ngrok URL for release builds | Uploaded |
| 4 | Skipped | — |
| 5 | FCM flow fixes: iOS foreground options, badge refresh, open tracking, error logging | Current |

### Build 5 Changes (Current)
1. **iOS foreground presentation**: `setForegroundNotificationPresentationOptions(alert, badge, sound)`
2. **Badge refresh on foreground push**: `NotificationCountService.increment()` called in `_handleForegroundMessage`
3. **Open analytics tracking**: `_trackNotificationOpen()` sends `notificationLogId` to backend on push tap
4. **Error logging**: `_registerToken()` logs success/failure instead of silent catch
5. **Backend**: `enableLegacyHttpTransport()` for HTTP/2 reliability
6. **Backend**: 1500ms delay between FCM batch sends to avoid rate limiting
7. **Backend**: `pruneStaleTokens(30)` method for FCM best practices compliance
