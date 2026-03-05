# StaffPicks

> Your friends work here.

StaffPicks is a social video tracking app — think Goodreads for everything you watch. Daily screenshot sync, friend recommendations, and a video store aesthetic that makes your watch history feel like a curated collection.

---

## Monorepo Structure

```
staffpicks/
├── apps/
│   ├── api/       Node.js + Fastify REST API (port 3001)
│   ├── web/       Next.js 15 App Router web app (port 3000)
│   └── mobile/    React Native + Expo SDK 52 (Expo Go / EAS)
│
├── packages/
│   ├── db/        Drizzle ORM schema + migrations (PostgreSQL)
│   ├── types/     Shared TypeScript types + Zod schemas
│   ├── utils/     Shared business logic (title matching, formatting)
│   └── ui/        Shared design tokens + component types
│
└── scripts/       One-off utility scripts
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20.0.0 |
| pnpm | ≥ 9.0.0 |
| PostgreSQL | ≥ 15 |

Install pnpm if needed:
```bash
npm install -g pnpm
```

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Copy the example env files and fill in your keys:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

API keys you'll need (see the prompt playbook for sign-up links):
- `DATABASE_URL` — PostgreSQL connection string
- `CLERK_SECRET_KEY` — from [clerk.com](https://clerk.com)
- `TMDB_API_KEY` — from [themoviedb.org](https://themoviedb.org/settings/api)
- `YOUTUBE_API_KEY` — from [console.cloud.google.com](https://console.cloud.google.com)
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)
- `CLOUDFLARE_R2_*` — from [dash.cloudflare.com](https://dash.cloudflare.com)

### 3. Set up the database

```bash
# Generate the initial migration from schema
pnpm db:generate

# Apply migrations to your database
pnpm db:migrate

# Seed with taste anchors and initial content
pnpm db:seed
```

### 4. Run all apps

```bash
# Run everything in parallel (API + web + mobile metro bundler)
pnpm dev

# Or run individually
pnpm dev:api      # API on http://localhost:3001
pnpm dev:web      # Web on http://localhost:3000
pnpm dev:mobile   # Expo dev server (scan QR with Expo Go)
```

---

## Running Each App

### API (`apps/api`)

```bash
cd apps/api
pnpm dev
# → http://localhost:3001/api/health
```

### Web (`apps/web`)

```bash
cd apps/web
pnpm dev
# → http://localhost:3000
```

### Mobile (`apps/mobile`)

```bash
cd apps/mobile
pnpm dev
# Scan the QR code with Expo Go on your phone
# iOS simulator: press 'i'
# Android emulator: press 'a'
```

---

## Key Tech Choices

| Layer | Choice | Why |
|-------|--------|-----|
| Monorepo | Turborepo | Fast caching, simple task graph |
| Package manager | pnpm | Workspace support, speed |
| API | Fastify | Fast, TypeScript-native, great plugin ecosystem |
| Web | Next.js 15 | App Router, RSC, great DX |
| Mobile | Expo SDK 52 | Fastest path to iOS + Android, OTA updates |
| Navigation | Expo Router | File-based routing, matches Next.js patterns |
| Database | PostgreSQL + Drizzle | Type-safe queries, great JSONB support |
| Auth | Clerk | Best-in-class social auth, webhook support |
| Vision AI | Anthropic Claude | Best-in-class screenshot parsing |
| Storage | Cloudflare R2 | S3-compatible, generous free tier |
| Types | Zod | Runtime + compile-time validation, shared schemas |

---

## Build Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | ✅ Scaffold | Monorepo, configs, Hello World in each app |
| 0.2 | ⏳ Next | Full database schema |
| 0.3 | ⏳ | Authentication (Clerk) |
| 1.1 | ⏳ | Content search + TMDB integration |
| 1.2 | ⏳ | Watch logging + Shelf UI |
| 1.3 | ⏳ | Screenshot sync pipeline |
| 1.4 | ⏳ | Social layer + feed |
| 1.5 | ⏳ | Onboarding flow |
| 2.1 | ⏳ | Next.js web app |
| 3.x | ⏳ | Push notifications, settings, App Store |

---

## Brand & Design

**Palette:** Dark warm video store aesthetic
- Background: `#1A1612` · Amber: `#E8A44A` · Cream: `#F5EDD6`

**Typography:**
- Display: Bebas Neue (headers, titles)
- Serif: Libre Baskerville (takes, italic copy)
- Body: Karla
- Mono: IBM Plex Mono (labels, metadata)

**Tagline:** *Be kind. Rewind. Come back tomorrow.*

---

## Contributing

This is a private project. See `staffpicks-product-design.md` for full product spec and `staffpicks-prototype.jsx` for the UI prototype reference.
