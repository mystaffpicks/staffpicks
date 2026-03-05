# StaffPicks — Launch Roadmap

## Phase 0: Secure the Brand (Week 1)

Before writing a line of code, lock down the name.

**Domain:**
Check and register domains. Priority order:
- staffpicks.app (ideal for an app-first product)
- staffpicks.co
- staffpicks.io
- getstaffpicks.com (fallback)

Use Namecheap, Google Domains, or Cloudflare Registrar.

**Trademark:**
- Search USPTO (uspto.gov) for existing "StaffPicks" or "Staff Picks" marks in Class 9 (software) and Class 42 (SaaS)
- File an Intent-to-Use trademark application if clear (~$250-350 per class via TEAS Plus)
- Consider consulting an IP attorney — a few hundred dollars now saves major headaches later

**App Store:**
- Reserve the name "StaffPicks" on both Apple App Store (via App Store Connect) and Google Play Console
- You can create a placeholder app entry without publishing — this locks the name

**Social handles:**
- Grab @staffpicks on Instagram, TikTok, X/Twitter, Threads
- If taken, try @getstaffpicks or @staffpicksapp

---

## Phase 1: Foundation (Weeks 2-4)

**Monorepo setup:**
```
staffpicks/
├── apps/
│   ├── mobile/          # React Native (Expo)
│   ├── web/             # Next.js
│   └── api/             # Backend (Node/Fastify or Spring Boot)
├── packages/
│   ├── ui/              # Shared components
│   ├── types/           # Shared TypeScript types
│   └── utils/           # Shared logic
├── scripts/
└── package.json
```

Use Turborepo or Nx for monorepo management. Expo for mobile gives you iOS + Android from one codebase plus Expo Go for fast dev iterations.

**Backend decisions:**
- Node.js (Fastify) aligns with the JS-everywhere approach and the Expo/Next.js frontend
- Spring Boot aligns with your existing Java/Angular expertise at Abra
- Either works — pick whichever you'll move faster in for a side project
- PostgreSQL is the right DB regardless of backend choice

**Infrastructure setup:**
- Hosting: Vercel (web) + Railway or Render (API + DB) for fast iteration. Move to AWS/GCP later when scale demands it.
- Auth: Clerk or Supabase Auth — handles email, Google, Apple sign-in out of the box
- Database: Supabase (Postgres + realtime + auth in one) or standalone Postgres on Railway
- File storage: Cloudflare R2 (S3-compatible, generous free tier, no egress fees)
- CDN: Cloudflare (free tier handles a lot)

**External API accounts:**
- TMDB API key (free, rate-limited) — your movie/TV metadata source
- YouTube Data API v3 key (free quota: 10,000 units/day)
- Anthropic API key (for Claude Vision screenshot parsing)
- Apple Developer Account ($99/year) — needed for App Store
- Google Play Developer Account ($25 one-time)

---

## Phase 2: Core MVP Build (Weeks 4-10)

Build in this order — each layer unlocks the next.

### Sprint 1: Auth + Content Database (Week 4-5)
- User registration/login (email + Google + Apple OAuth)
- User profile (name, avatar, bio, enabled platforms)
- Content model seeded from TMDB bulk export (~900K movies, ~160K TV series)
- Content search endpoint (full-text search via Postgres or ElasticSearch)
- Basic content detail view

### Sprint 2: Watch Logging + The Shelf (Week 5-6)
- Manual log: search → tap → log as watching/watched
- WatchEntry model with rating, take, mood tags, privacy level
- "My Shelf" view: Now Playing + Recently Returned
- Shelf/list/stats toggle views
- Watchlist (want to watch) with add/remove

### Sprint 3: Screenshot Sync Pipeline (Week 6-8)
This is the hardest and most novel feature. Build it incrementally:
- Image upload flow (camera roll import or in-app capture)
- Platform detection (start rule-based: Netflix = dark UI + red, YouTube = white + red)
- Claude Vision API integration with platform-specific prompts
- Structured JSON extraction from AI response
- Canonical matching: extracted titles → TMDB search → fuzzy match → confidence score
- Diff engine: compare extractions against existing user log
- Review UI: scroll-through confirmation with accept/dismiss/edit
- Start with 3 platforms: Netflix, YouTube, Disney+

### Sprint 4: Social Layer (Week 8-9)
- Follow/unfollow system
- Social feed: friend activity digest (daily format, not infinite scroll)
- Feed items: logged, started watching, finished, added to watchlist
- Staff pick card design: friend avatar, show title, take, rating stamp
- Basic privacy controls: public/friends/private per entry

### Sprint 5: Onboarding + Cold Start (Week 9-10)
- Mood mapping questionnaire
- Taste anchor grid (curated list of ~200 titles)
- Platform selection
- Personalized seed list generation
- Friend finder (contacts import, Google sign-in matching)
- Pre-friend feed: "People with your taste are watching..."

---

## Phase 3: Polish + TestFlight (Weeks 10-12)

**Mobile polish:**
- Push notifications (daily sync reminder at user-configured time)
- Share extension (receive URLs from other apps)
- App icon, splash screen, App Store screenshots
- Haptic feedback on log actions
- Offline support for viewing your shelf

**Web polish:**
- Public profiles (SEO-friendly via Next.js SSR)
- Open Graph meta tags for shared picks
- Responsive design across breakpoints

**Testing:**
- TestFlight beta with 20-30 friends/family
- Focus testing on: onboarding completion rate, daily sync friction, screenshot parsing accuracy
- Iterate on platform prompt templates based on real screenshots

---

## Phase 4: Launch (Week 12-14)

**App Store submission:**
- App Store review guidelines compliance check
- Privacy policy and terms of service (use a generator like Termly, then have a lawyer review)
- App Store description, keywords, screenshots, preview video
- Submit for review (allow 1-2 weeks for approval + potential rejections)

**Launch strategy:**
- Soft launch to TestFlight users first — iron out any remaining issues
- Product Hunt launch (prep: tagline, description, maker comment, screenshots, demo video)
- Reddit posts: r/movies, r/television, r/cordcutters, r/Letterboxd, r/apps
- Social media: post from @staffpicks accounts with the video store aesthetic
- Personal network: get 50-100 people using it in the first week — social apps need a critical mass of connected users to feel alive

**Content seeding:**
- Pre-populate your own shelf with real picks and takes
- Ask beta testers to do the same before public launch
- Create a few "featured staff" profiles with great taste and active picks

---

## Phase 5: Post-Launch Iteration (Months 2-4)

Based on user feedback and data, prioritize from the v2 backlog:

**High priority (likely):**
- Clip uploads (hybrid storage model)
- More platform screenshot templates (Hulu, HBO, Prime, TikTok)
- GDPR data export importers (Netflix viewing history CSV)
- Taste match scores between friends
- Notifications beyond daily sync

**Medium priority:**
- Custom audience groups (Film Club, Family, Work People)
- Advanced stats and year-in-review
- Browser extension for passive logging
- Share sheet URL ingestion

**Lower priority:**
- Monetization (premature before product-market fit)
- Cross-platform "where to watch"
- Scheduled sync reminders via iOS Shortcuts

---

## Cost Estimates (MVP through Launch)

**Monthly recurring:**
- Vercel Pro: $20/mo
- Railway/Render (API + DB): $20-50/mo
- Cloudflare R2: ~free at MVP scale
- Anthropic API (Claude Vision for screenshot parsing): ~$50-100/mo at 1K daily active users (roughly $0.01-0.02 per screenshot parse)
- TMDB API: free
- YouTube Data API: free (within quota)
- Total: ~$100-170/mo

**One-time:**
- Apple Developer Account: $99/year
- Google Play Developer: $25
- Domain: $10-30/year
- Trademark filing: $250-350 per class
- Total: ~$400-500

**Optional but recommended:**
- IP attorney consultation: $500-1,000
- Designer for App Store assets/icon: $200-500 (or do it yourself with the prototype aesthetic)
- Legal review of terms/privacy: $500-1,000

**Total to launch: roughly $1,500-3,000 out of pocket**, with ~$150/mo ongoing. Very reasonable for a side project with real potential.

---

## Key Risk Mitigations

**Screenshot parsing accuracy:**
Start with the 3 most standardized platforms (Netflix, YouTube, Disney+). Build a feedback loop where users flag incorrect extractions — this data improves your prompts over time. Keep manual logging as a first-class fallback so the app is useful even when parsing fails.

**Cold start / chicken-and-egg:**
The taste profile onboarding seeds history without friends. The "people with your taste" pre-friend feed gives day-one content. Launch with a tight group who already know each other to create real social graph density.

**API costs at scale:**
Claude Vision is the biggest variable cost. At scale, consider caching common screenshot patterns, batching multiple screenshots in a single API call, or training a lighter-weight model for platform detection to reduce the work Claude needs to do.

**Platform UI changes breaking screenshot parsing:**
Server-side prompt templates that update without app releases. User feedback flagging creates an early warning system. The manual logging fallback means the app never fully breaks.

**Copyright on clips:**
Defer clips to v2. When you build it, the hybrid model (short preview + source deep link) minimizes exposure. Consult an IP attorney before launching the clip feature.
