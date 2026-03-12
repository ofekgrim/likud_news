# App Store & Google Play Screenshots

## Required Dimensions

### Apple App Store
| Device           | Resolution (px) | Required |
|------------------|------------------|----------|
| iPhone 6.7"      | 1290 x 2796      | Yes      |
| iPhone 6.5"      | 1242 x 2688      | Yes      |
| iPad 12.9" (6th) | 2048 x 2732      | Optional |

### Google Play Store
| Device           | Resolution (px) | Required |
|------------------|------------------|----------|
| Phone            | 1080 x 1920 min  | Yes      |
| 7" Tablet        | 1200 x 1920      | Optional |
| 10" Tablet       | 1600 x 2560      | Optional |

## Screenshot Concepts (8 screens)

All screenshots should use Likud branding (#0099DB blue, Heebo font) with Hebrew RTL layout as the primary version. English versions should mirror the layout in LTR.

### 1. Home Feed with Breaking News
- Show the main news feed with a breaking news banner at the top
- Live ticker visible at the bottom
- Caption (HE): "כל החדשות - במקום אחד"
- Caption (EN): "All the news - in one place"

### 2. Candidate Matcher Quiz (Swipe Cards)
- Show the swipe card interface with a policy question
- Left/right swipe indicators visible
- Progress bar at the top
- Caption (HE): "גלו את המועמד שלכם"
- Caption (EN): "Discover your candidate"

### 3. Candidate Comparison Radar Chart
- Show two candidates side by side with an interactive radar chart
- Key issues as axes on the chart
- Caption (HE): "השוו בין מועמדים בקלות"
- Caption (EN): "Compare candidates easily"

### 4. Live Election Results Dashboard
- Show the results dashboard with bar charts and percentages
- Real-time update indicator
- Regional breakdown visible
- Caption (HE): "תוצאות חיות ליל הבחירות"
- Caption (EN): "Live results on election night"

### 5. Polling Station Map with Traffic Lights
- Show the map view with color-coded polling stations
- Green/orange/red markers indicating wait times
- User location pin and navigation option
- Caption (HE): "מצאו את הקלפי הקרובה"
- Caption (EN): "Find your nearest polling station"

### 6. Gamification: Streaks, Badges, Tier
- Show the user profile with streak counter, tier badge, and collected badges
- Tier progression bar visible
- "I Voted" badge prominently displayed
- Caption (HE): "צברו נקודות וטפסו בדרגות"
- Caption (EN): "Earn points and climb the ranks"

### 7. Daily Missions
- Show the daily missions list with checkboxes and point values
- Mix of completed and available missions
- Daily streak counter at the top
- Caption (HE): "משימות יומיות - כל יום אתגר חדש"
- Caption (EN): "Daily missions - a new challenge every day"

### 8. I Voted Shareable Card
- Show the "I Voted" card designed for social media sharing
- Likud branding with personalized details
- Share button options (WhatsApp, Instagram, etc.)
- Caption (HE): "שתפו שהצבעתם!"
- Caption (EN): "Share that you voted!"

## File Naming Convention

```
store-listing/screenshots/{locale}/{device}/{number}_{concept}.png
```

Examples:
```
store-listing/screenshots/he/iphone_6.7/01_home_feed.png
store-listing/screenshots/he/iphone_6.7/02_candidate_matcher.png
store-listing/screenshots/en/phone/01_home_feed.png
```

## Design Guidelines

- Background: Gradient from #0099DB to #006B99 or clean white
- Text overlay: Heebo Bold for Hebrew, Heebo Medium for English
- Device frames: Use device mockups for App Store, frameless for Google Play
- All text must be legible at small sizes
- Maintain consistent spacing and alignment across all screenshots
- Feature phone with app screenshot centered, caption text above or below
