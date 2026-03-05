# StaffPicks — Product Design Document v2

## Vision

StaffPicks is where watching becomes social. It's a unified tracker for everything you watch — across Netflix, YouTube, TikTok, Hulu, Disney+, and beyond — designed around one core belief: **watching is better when it's shared.**

Streaming turned watching into a solitary activity. You binge alone, scroll alone, and the algorithm decides what's next. StaffPicks flips that: your friends become the recommendation engine, your watch history becomes a conversation starter, and your private screen time becomes engaged time with the people you care about.

Think of it as the video store your friends run. They know your taste, they've got the best picks, and every recommendation comes with a story.

---

## Problem Statement

Watch history is fragmented across a dozen platforms, each engineered to keep you watching alone. There's no single place to:

- See everything you've watched in one timeline
- Turn your viewing into a shared experience with friends
- Discover what real friends recommend vs. what algorithms push
- Share the specific moments that sold you on a show (not just star ratings)
- Build a watchlist from trusted taste, not ads
- Track your habits and watch with more intention

Letterboxd does this for films. TV Time covers shows. Nobody covers the full spectrum — YouTube, TikTok, and short-form alongside traditional streaming — and nobody makes the social connection the point.

---

## Brand & Design Philosophy

StaffPicks draws inspiration from the warmth and personality of a great independent video store — the kind of place where the staff knows your taste, handwritten recommendations line the shelves, and you leave with something you'd never have found on your own.

The design is intentionally distinct from streaming apps. No dark void. No autoplay. No infinite scroll. Instead: warm, textured, cinematic, with the feel of browsing curated shelves.

**Design principles:**

1. **Video store warmth** — dark but inviting palette inspired by vintage cinema; film grain texture; warm amber accents against rich browns and deep backgrounds
2. **Staff picks over algorithms** — friend recommendations are presented like curated shelf cards with personal takes, not algorithmic content cards
3. **Watch better, not less** — the goal isn't guilt about screen time. It's transforming solo watching into shared experiences. Metrics highlight social engagement ("4 of those hours were shows friends recommended") not just hours logged
4. **Cinematic typography** — bold display type (Bebas Neue) for impact, refined serif (Libre Baskerville) for personal takes, creating a movie-poster-meets-journal aesthetic
5. **Intentional simplicity** — fewer screens, finite feeds (daily digest, not infinite scroll), and deliberate friction that makes logging feel like curating your personal collection

---

## Core Feature Set

### 1. Daily Sync Ritual (Primary Engagement Loop)

The flagship interaction. A guided daily check-in that replaces passive data collection with an intentional reflection moment.

**The Flow:**

**Evening notification** (user-configurable, default 9pm): "What did you watch today?"

**Step 1 — Capture**
App shows a carousel of the user's enabled platform cards (Netflix, YouTube, Disney+, etc.). Each card includes a visual guide showing exactly where to find watch history in that app. User taps a platform → switches to that app → screenshots their history/continue watching screen → returns to StaffPicks. Or imports screenshots already in their camera roll from today. Can do one platform or all of them.

**Step 2 — Processing**
Brief loading state (3-8 seconds) while vision AI extracts content from screenshots. All screenshots processed in parallel. Show the user something engaging while they wait — their running stats, a friend's recent log entry, or a mindful prompt ("The average American watches 4 hours of TV per day. How does today feel for you?").

**Step 3 — Review (scroll-through)**
Each extracted item appears as a card: thumbnail, title, platform, and AI's best guess at status (watching / finished / rewatching). User scrolls through the full list. At the bottom: "Looks good" button to confirm all, or "Edit these" to make corrections. Individual cards can be tapped to edit or swiped away to dismiss. Low-confidence extractions get a subtle visual indicator prompting the user to double-check.

**Step 4 — Enrich (optional, fast)**
After confirming, optional quick-add on each item:
- Rate it (1-10 tap scale)
- Quick take (one-line text)
- Mood/vibe tag ("cozy," "intense," "background noise," "couldn't stop watching")
- Share a clip (links to clip flow)
All skippable. Power users engage, casual users tap "Done."

**Step 5 — Social payoff**
After syncing, show them what friends logged today — this is the reward. You did your part, now see what everyone else watched. Surface overlaps ("Jake started Severance S2 too!") and friend recommendations. The insight angle is social, not self-critical: "4 of your watches this week came from friend recommendations — your friends have good taste."

**Target: under 60 seconds if nothing needs editing.**

**Deduplication across days:**
Screenshots from consecutive days will overlap heavily (same Continue Watching row). The pipeline diffs extracted titles against the user's existing log and only surfaces genuinely new items. Pre-filtered before the review step.

### 2. Screenshot Ingestion Pipeline (Technical Core)

The primary data ingestion method. Universal across all platforms regardless of API availability.

**Pipeline architecture:**

```
Screenshot received
    ↓
Temporary storage (processing bucket)
    ↓
Platform detection (classifier: UI chrome, colors, layout)
    ↓
Vision AI extraction (Claude API, platform-specific prompt)
    ↓
Structured output (JSON: titles, statuses, confidence scores)
    ↓
Canonical matching (TMDB lookup + fuzzy match + disambiguation)
    ↓
Diff against existing user log
    ↓
Present new items for user review
    ↓
Confirmed items → write to watch log
```

**Platform detection:**
Lightweight classifier identifies the source app from UI elements, color scheme, and layout. Can be rule-based initially (Netflix = dark background + red accents + horizontal card rows), upgraded to ML classifier as volume grows. Fallback: user manually tags which app the screenshot is from.

**Vision AI extraction:**
Platform-specific prompt templates sent to Claude's vision API. Each template tells the model what to look for and how the UI is structured.

Example prompt context for Netflix:
- "Continue Watching" row = currently watching, note progress bar percentage
- "Watch Again" row = previously completed
- Large title text on dark backgrounds
- Extract: title, row context, progress indicator if visible

Example prompt context for YouTube History:
- Vertical list with thumbnails, video titles, channel names, relative timestamps
- Extract: video title, channel name, duration, timestamp ("3 hours ago")

**Prompt versioning:**
Templates stored server-side, versioned, and updatable without app releases. When streaming apps redesign their UI, prompts can be updated immediately. User feedback on incorrect extractions triggers review of the relevant platform template.

**Output format per extracted item:**
```json
{
  "title": "Severance",
  "platform": "apple_tv",
  "inferred_status": "watching",
  "confidence": 0.92,
  "metadata": {
    "season": 2,
    "episode": 4,
    "progress_percent": 65
  },
  "raw_text": "Severance S2 E4"
}
```

### 3. Canonical Content Matching (Critical Infrastructure)

Every log entry must link to a canonical content record. This powers the social features — "3 friends also watched this" only works if everyone's entry points to the same record.

**Matching pipeline (in order of confidence):**

1. **Exact match** — normalized title string matches existing canonical entry. Case-insensitive, stripped of articles ("The"), punctuation normalized. Catches ~60-70% of cases.

2. **Fuzzy match** — Levenshtein distance for variations ("The Bear" vs "The Bear (FX)" vs "The Bear Season 3"). Threshold tuned to avoid false positives.

3. **Disambiguation via metadata** — platform context narrows candidates. "The Office" from Netflix in US = US version. Year, genre, episode count, and any extracted metadata help disambiguate.

4. **TMDB lookup** — for movies and TV, search TMDB API with extracted title + metadata. TMDB canonical IDs become the source of truth. High-quality, community-maintained, free API.

5. **YouTube canonical** — YouTube video IDs are unique identifiers. Channel-level grouping for "I follow this creator" entries. Playlist and series detection where available via YouTube Data API.

6. **Short-form / URL-keyed** — TikTok and similar content keyed on source URL. Matching occurs when two users share the same URL. Creator-level grouping as a secondary signal.

7. **Manual resolution** — low-confidence matches present the user with options: "Did you mean X or Y?" Community corrections improve the matching model over time.

**Confidence scoring:**
Every log entry carries a match confidence score. High-confidence entries (>0.85) immediately participate in social features. Low-confidence entries (<0.85) are queued for user confirmation before appearing in "friends also watched" aggregations.

**Content database seeding:**
The canonical database grows organically from user activity. Every successfully matched entry enriches the catalog. The initial database is seeded from TMDB's full movie/TV catalog. YouTube and short-form content builds up from user submissions.

### 4. Cold Start: Taste Profile Onboarding

The onboarding questionnaire solves the cold start problem from both sides: seeds watch history AND generates signal for social matching. Should feel like a fun quiz, not a form. Target: under 2 minutes.

**Step 1 — Mood mapping**
Not "pick your favorite genres" (too analytical). Instead, situational prompts:
- "Friday night, nothing planned. You're reaching for..." → visual cards: a cozy comfort rewatch / something intense and bingeable / background noise while I cook / a deep YouTube rabbit hole / mindless TikTok scrolling
- "Sunday morning..." → same concept, different options
- "Can't sleep at 2am..." → different options again

User picks 1-2 per scenario. Builds a viewing personality profile without forcing self-categorization.

**Step 2 — Taste anchors**
Grid of 20-30 well-known titles across content types. Big visual cards with poster art / thumbnails. Mix of Netflix hits, classic shows, popular YouTube channels, trending TikTok creators. Calibrated for recency and discriminating power (Severance tells you more than The Office).

User taps titles they've watched or creators they follow. These are anchor signals for the recommendation engine.

**Step 3 — Platform selection**
"Where do you watch?" User taps their platforms. Serves double duty: configures which screenshot templates to prepare for daily sync, AND narrows recommendation engine to content available on their platforms.

**Step 4 — Personalized seed list**
Based on mood mapping, taste anchors, and platforms, generate a personalized list: "Based on your taste, you've probably watched or are watching these."

Each item has three tap options:
- **Watching** → adds to log as currently watching
- **Watched** → adds as completed
- **Not for me** → dismisses (negative signal is equally valuable)

Powered initially by a hand-curated taste graph: a mapping of "if you liked X, you probably watch Y" covering ~200-300 anchor titles and creators. Organized into taste clusters (prestige TV, reality TV, true crime, tech YouTube, comedy TikTok, anime, etc.). Built in a spreadsheet, replaced over time with collaborative filtering from real user data.

**Step 5 — Find friends**
Contacts import, Google sign-in for finding Gmail contacts, optional Instagram/TikTok connection for finding existing follows. Populated watch history means friend suggestions can immediately show: "You and Sarah have both watched 4 of the same shows."

**Pre-friend social:**
Before friends join, show public activity from users with similar taste profiles. "People with your taste are watching..." gives the feed content on day one. Real friend activity gradually replaces algorithmic suggestions as the social graph fills in.

### 5. Social Feed (Retention Loop)

What your friends are watching, presented as a calm journal-style feed rather than an infinite scroll.

**Feed content:**
- "[Friend] watched Severance S2E4" — with optional rating/take
- "[Friend] is currently watching Shōgun" — status updates
- "[Friend] shared a clip of [content]" — clip recommendations
- "[Friend] added to their watchlist" — light activity signals
- Aggregated: "3 friends watched White Lotus this week"

**Privacy model (key differentiator):**
- **Public**: visible to all followers
- **Friends only**: visible to mutual connections
- **Private**: only the user sees it (the "guilty pleasure" tier)
- **Custom lists**: share with specific groups ("Film Club," "Family," "Work People")
- **Per-item override**: default privacy level with per-item toggle
- **Hidden from feed**: logged for personal records, invisible to others
- **Content-type defaults**: e.g., "All TikTok watches are private by default"

**Feed design choices:**
- No infinite scroll — daily digest format grouped by today / this week
- No autoplay on clip previews — tap to play
- No engagement metrics visible (no like counts, no viral indicators)
- Friend takes and reviews are the primary content — presented like video store "staff picks" with personal commentary
- Social metrics highlighted over consumption metrics ("3 friends also watched this" over "trending now")

### 6. Hybrid Clip System (Viral Mechanic)

Short clips as the recommendation format — more compelling than star ratings, designed for sharing not consumption.

**Clip creation flow:**
1. User screen-records a moment from any streaming app
2. Shares to StaffPicks via share sheet
3. App helps them trim to key moment (15-60 seconds)
4. Tags it with status: "watching," "watched," or "want to watch"
5. Attaches to canonical content entry (auto-matched or manually tagged)
6. Optional caption: "This scene sold me on the whole show"
7. Clip appears in followers' feeds attached to the content card

**Hybrid storage model:**
- **Thumbnail**: first frame or user-selected frame, stored permanently (tiny cost)
- **Short preview**: first 5-10 seconds, compressed to 480p, stored on CDN (moderate cost)
- **Source reference**: platform, content ID, timestamp range, original share URL
- **Full playback**: deep-link to source app at correct timestamp, or play user's original recording

**Feed experience:**
Friends see thumbnail + preview. Tapping "Watch full clip" deep-links into the source app or plays the stored recording. The preview hooks interest; the source app delivers the full moment. This is platform-friendly (drives traffic to their app) and reduces copyright exposure.

**Storage projections:**
10-second 480p preview ≈ 1-2MB. At 10,000 active users × 5 clips/week = 50-100GB/week. Lifecycle policy: clips older than 90 days downgrade to thumbnail-only unless the user opts to keep them.

**Legal considerations:**
- Short clips for commentary/recommendation likely fall under fair use, but needs legal review
- DMCA takedown process from day one
- Deep-linking to source apps rather than hosting full content reduces exposure
- Automated content scanning for nudity/violence/copyright via AWS Rekognition or similar

### 7. Social Insights (Differentiator)

Weekly and monthly reflection focused on the quality and social dimension of viewing — not guilt about quantity.

- "4 of your 14 hours this week were shows friends recommended — that's time well spent"
- "You and Sarah watched the same 2 shows this week"
- "3 friends finished White Lotus — the takes are rolling in"
- "You've been on a sci-fi run. Jake's queue has 3 you might like."
- "You finished 3 series this month and started 2 new ones — you're a closer"

Optional intention-setting: "I want to watch more stuff my friends recommend this month" with gentle tracking. The frame is always social quality, not screen time reduction. Never punitive. Always oriented toward connection.

---

## Information Architecture

### Navigation (Mobile — Bottom Tab Bar)

```
[Today]  [Search]  [My Log]  [Watchlist]  [Profile]
```

- **Today**: Daily sync entry point + social feed digest
- **Search**: Universal search → quick log or add to watchlist
- **My Log**: Personal watch history timeline with filters
- **Watchlist**: "Want to watch" queue, organized by platform/genre/priority
- **Profile**: Stats, public log, mindful insights, settings

### Key Screens

**Today (Home)**
- Daily sync prompt if not yet completed
- Today's social digest: what friends logged
- This week's viewing summary (compact)
- No infinite scroll — finite, bounded content

**Search & Log**
- Universal search: movies, TV, YouTube, manual entry
- Recent searches
- Quick-log shortcut from search results (one tap)
- "Can't find it?" → manual entry with user-supplied metadata

**My Log**
- Timeline view (default): scrollable history grouped by day/week/month
- Grid view: poster/thumbnail grid, sortable
- Stats view: hours watched, genre breakdown, platform distribution, streaks
- Filters: by platform, genre, rating, content type, date range
- Export: CSV/JSON export of full watch history

**Content Detail Page**
- Poster/thumbnail, metadata, platform availability
- User's rating + take
- Friends who watched + their ratings
- Clip recommendations from friends
- "Add to watchlist" / "Log as watched"
- Link to watch on source platform

**Profile**
- Avatar, bio, taste profile summary
- Viewing stats (configurable visibility)
- "Currently watching" shelf
- Recent activity
- Followers/following
- Social insights (taste matches, shared watches)

---

## Data Model (Core Entities)

```
User
├── id, username, display_name, avatar_url, bio
├── email, auth_provider
├── default_privacy_level (public | friends | private)
├── content_type_privacy_defaults (JSON)
├── enabled_platforms (JSON array)
├── taste_profile (JSON — mood mappings, genre affinities)
├── sync_reminder_time (time, default 21:00)
└── created_at, updated_at

Content (canonical records)
├── id, content_type (movie | tv_series | tv_episode | youtube | short_form | documentary | live)
├── title, description, thumbnail_url, poster_url
├── external_ids (tmdb_id, youtube_id, imdb_id, tiktok_url, etc.)
├── metadata (JSON — runtime, director, channel, creator, season, episode, etc.)
├── platform_availability (JSON array)
├── match_aliases (JSON array — known alternative titles/spellings)
└── created_at, updated_at

WatchEntry
├── id, user_id, content_id
├── status (watched | watching | dropped | rewatching)
├── rating (1-10, nullable)
├── take (short text, nullable)
├── mood_tags (JSON array — "cozy", "intense", "background")
├── privacy_level (public | friends | private | custom)
├── custom_audience_id (nullable, FK to AudienceGroup)
├── hide_from_feed (boolean)
├── rewatch_count (integer, default 0)
├── watched_on (date, nullable)
├── platform (where they watched it)
├── source (manual | screenshot_sync | share_link | onboarding | clip_auto)
├── match_confidence (float, 0-1)
└── created_at, updated_at

WatchlistItem
├── id, user_id, content_id
├── priority (high | medium | low)
├── suggested_by_user_id (nullable)
├── suggestion_note (nullable)
├── platform_preference
└── created_at

Clip
├── id, user_id, content_id, watch_entry_id
├── thumbnail_url (permanent, CDN)
├── preview_url (short preview, CDN, lifecycle-managed)
├── source_type (upload | youtube_timestamp | platform_link)
├── source_url (original link for deep-linking)
├── start_time, end_time (for timestamp references)
├── caption
├── duration_seconds
├── privacy_level (inherits from watch_entry or override)
├── status_tag (watching | watched | want_to_watch)
└── created_at

ScreenshotSync
├── id, user_id
├── image_url (temporary processing storage)
├── detected_platform
├── extracted_items (JSON array — raw AI output)
├── confirmed_items (JSON array — user-reviewed)
├── processing_status (pending | processing | review | confirmed | failed)
├── processed_at, confirmed_at
└── created_at

AudienceGroup
├── id, owner_user_id, name
└── created_at

AudienceGroupMember
├── group_id, user_id
└── added_at

Follow
├── follower_id, following_id
├── status (active | pending)
└── created_at

Interaction
├── id, user_id
├── target_type (watch_entry | clip | watchlist_item)
├── target_id
├── interaction_type (like | comment | share | suggest)
├── content (text, for comments)
└── created_at

TasteAnchor (curated recommendation graph)
├── id, content_id
├── cluster (prestige_tv | reality | true_crime | tech_youtube | comedy_tiktok | anime | etc.)
├── related_content_ids (JSON array — "if you liked this, you probably watch these")
├── discriminating_power (float — how much this title tells you about taste)
└── updated_at

PlatformPromptTemplate
├── id, platform
├── version
├── prompt_text
├── ui_description (what the current UI looks like for the AI)
├── active (boolean)
└── updated_at
```

---

## Technical Architecture

### Stack

**Frontend (simultaneous web + mobile):**
- React Native (Expo) for mobile (iOS + Android)
- Next.js for web — SSR for SEO on public profiles
- Shared component library via monorepo (packages/ structure)
- React Native Web bridges most components

**Backend:**
- Node.js (Fastify) or Java (Spring Boot) — either works; Node aligns with JS-everywhere, Spring Boot aligns with existing Abra expertise
- PostgreSQL — relational model fits social graph + content catalog
- Redis — feed caching, session management, rate limiting
- ElasticSearch — content search across all types

**AI/ML Pipeline:**
- Claude Vision API — screenshot content extraction
- Platform-specific prompt templates (server-side, versioned)
- Fuzzy text matching (pg_trgm or dedicated service)
- TMDB API — movie/TV canonical matching

**Media Infrastructure:**
- S3-compatible storage for clip uploads and screenshot processing
- CDN (CloudFront or Cloudflare R2) for clip preview delivery
- Video processing pipeline: FFmpeg via Lambda or Mux for transcoding
- Lifecycle policies for storage management

**Background Jobs:**
- Bull/BullMQ (Node) or equivalent
- Screenshot processing queue
- Feed fanout
- Clip transcoding
- Platform prompt template updates
- TMDB catalog sync

**External APIs:**
- TMDB API — movies and TV metadata (free, rate-limited)
- YouTube Data API v3 — video/channel metadata
- JustWatch (unofficial or similar) — platform availability lookup
- Open Graph scraping — fallback metadata for TikTok, Reels, etc.
- Claude Vision API — screenshot parsing

### Platform Integration Strategy

Screenshot-first approach makes every platform equally accessible.

| Platform | Screenshot Sync | Share Link Support | API Import |
|----------|----------------|-------------------|------------|
| Netflix | Yes (primary) | URL → TMDB match | No public API |
| YouTube | Yes | Full metadata via API | OAuth watch history |
| Disney+ | Yes (primary) | URL → TMDB match | No public API |
| Hulu | Yes (primary) | URL → TMDB match | No public API |
| HBO Max | Yes (primary) | URL → TMDB match | No public API |
| Amazon Prime | Yes (primary) | URL → TMDB match | No public API |
| TikTok | Yes (profile history) | URL + OG scraping | No reliable API |
| Apple TV+ | Yes (primary) | URL → TMDB match | No public API |

**Supplementary ingestion methods:**
1. Share sheet URL parsing — catches intentional shares between apps
2. GDPR data export importers — bulk historical import from platforms that support data download
3. Browser extension (future) — passive detection of what's playing
4. Manual search + log — always available as fallback

---

## Privacy & Content Moderation

### Privacy Controls
- Profile-level default privacy
- Content-type-level defaults (e.g., all TikTok watches default to private)
- Per-entry override
- Custom audience groups for selective sharing
- "Hide from feed" toggle
- Private accounts (approve followers)
- Block/mute users

### Content Moderation
- Clips: automated scanning via AWS Rekognition or Google Video Intelligence
- DMCA takedown process from day one
- Community reporting with human review queue
- Rate limiting on clip uploads
- Text: standard abuse filtering on takes and comments

---

## Monetization Considerations (Future)

- **Free tier**: full tracking, social feed, daily sync (3 screenshots/day), limited clip uploads (5/month)
- **Premium**: unlimited screenshots and clips, advanced mindful insights, year in review, custom themes, export features, extended clip retention
- **Affiliate links**: "Watch on Netflix" links with affiliate attribution
- **Data insights**: anonymized, aggregated viewing trend data (only with clear user consent)

Note: no promoted content or ad-supported tier. This contradicts the friends-first recommendation model and would erode trust.

---

## MVP Scope (v1)

Ship the smallest thing that delivers the core loop: **sync → review → see friends → reflect.**

### In MVP:
- User auth (email + Google/Apple OAuth)
- Taste profile onboarding questionnaire
- Content search (TMDB for movies/TV, YouTube API for videos)
- Daily sync ritual with screenshot ingestion (top 3 platforms: Netflix, YouTube, Disney+)
- Vision AI extraction pipeline with platform-specific prompts
- Canonical matching via TMDB + fuzzy text matching
- Manual logging as fallback
- Privacy levels (public, friends, private)
- Social feed (daily digest format)
- Follow/unfollow
- Basic profile with watch stats
- Watchlist (want to watch)
- Weekly viewing insights (hours watched, genre breakdown)

### Deferred to v2:
- Clip uploads and sharing (hybrid storage)
- Custom audience groups
- Browser extension
- GDPR data export importers
- Advanced mindful insights and goal-setting
- Short-form content screenshot templates (TikTok/Reels)
- Taste match scores between friends
- Notifications beyond daily sync reminder
- Cross-platform "where to watch"
- Share sheet URL ingestion
- Year in review

---

## Open Questions

1. **Naming**: "StaffPicks" is a placeholder. The mindful/intentional positioning suggests something warmer. Directions to explore: journal-inspired names, reflection-themed names, or something entirely abstract.
2. **Screenshot frequency**: Is daily realistic long-term? Should there be a "sync when you feel like it" mode alongside the daily ritual?
3. **YouTube granularity**: Do users want every YouTube video logged, or only intentional watches? Consider a "minimum duration" filter (e.g., ignore videos under 2 minutes).
4. **Spoiler handling**: How do friend takes/clips avoid spoiling? Spoiler tags with tap-to-reveal? Time-delayed visibility for new releases?
5. **TV episode granularity**: Log per-episode or per-season? Per-episode is more accurate but higher friction for the screenshot pipeline.
6. **Clip copyright**: Fair use for commentary/recommendation is defensible but not bulletproof. Legal review needed pre-launch.
7. **AI cost at scale**: Claude Vision API calls for every screenshot sync. At 10K daily active users × 2 screenshots/day = 20K API calls/day. Need to model cost and consider batching or caching strategies.
8. **Social insights tone**: How do you surface "you watched a lot alone this week" without being preachy? The frame should always be "here's what your friends are watching" not "you should watch less." This is a UX writing challenge as much as a feature challenge.
