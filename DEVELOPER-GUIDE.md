# StaffPicks — Developer Guide
### For people who have never built an app before

---

## What's actually happening

Every time we build a phase together, I (Claude) write the code files directly into your `StaffPicks` folder on your computer. I also commit those files to a local Git history — think of Git as a save-game system that remembers every version of every file. Then I push those commits to GitHub, which is the online backup and collaboration hub.

You don't need to write any code yourself. Your job is to:
1. Make sure the app is configured with your API keys
2. Run a few commands in Terminal to install dependencies and start the app
3. Test it and tell me what to build next

---

## Your toolbox

You're on Windows — everything works great. You do **not** need a Mac.

> **The one exception:** Submitting to the iOS App Store requires compiling with Xcode, which only runs on Mac. We get around this entirely using **EAS Build** — Expo's cloud service that compiles your iOS app on their Mac servers. You just run a command and they handle it. No Mac needed.

Open **PowerShell** or **Windows Terminal** and run each check:

```bash
# Check Node.js (should say v20 or higher)
node --version

# Check pnpm (our package manager)
pnpm --version

# Check Git
git --version
```

If anything is missing:
- **Node.js** → download from [nodejs.org](https://nodejs.org) (LTS version)
- **pnpm** → run `npm install -g pnpm` in PowerShell
- **Git** → download from [git-scm.com](https://git-scm.com/download/win)

---

## The folder structure

Your `StaffPicks` folder on your Desktop contains the whole app:

```
StaffPicks/
├── apps/
│   ├── api/          ← The backend server (runs on your computer or Railway)
│   ├── web/          ← The website (runs on Vercel)
│   └── mobile/       ← The iPhone/Android app (runs via Expo)
├── packages/
│   ├── db/           ← Database schema and migrations
│   ├── types/        ← Shared TypeScript types
│   ├── utils/        ← Shared helper functions
│   └── ui/           ← Shared design tokens
└── package.json      ← Root config — ties everything together
```

---

## First-time setup (do this once)

### Step 1 — Install dependencies

Open **PowerShell** or **Windows Terminal**, navigate to your StaffPicks folder, and run:

```bash
cd "C:\Users\AndrewForbes\OneDrive - luminatussoftware.com\Desktop\Claude\StaffPicks"
pnpm install
```

> **Note:** This installs ~1,200 packages. It will take a few minutes. You'll see a lot of text fly by — that's normal. Wait for it to finish.

### Step 2 — Set up your environment files

Environment files hold your secret API keys. They are never committed to GitHub (Git ignores them). You need to create them from the examples:

**For the API:**
```bash
cp apps/api/.env.example apps/api/.env
```
Then open `apps/api/.env` in a text editor and fill in:
- `DATABASE_URL` — your PostgreSQL connection string (from Railway or Supabase)
- `CLERK_SECRET_KEY` — from [dashboard.clerk.com](https://dashboard.clerk.com)
- `TMDB_API_KEY` — from [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
- `YOUTUBE_API_KEY` — from [console.cloud.google.com](https://console.cloud.google.com)
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)

**For the web app:**
```bash
cp apps/web/.env.local.example apps/web/.env.local
```
Fill in:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — from Clerk dashboard (starts with `pk_test_`)
- `CLERK_SECRET_KEY` — same as above

**For mobile:**
```bash
cp apps/mobile/.env.example apps/mobile/.env
```
Fill in:
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — same publishable key from Clerk

### Step 3 — Run your database migrations

This creates all the tables in your PostgreSQL database:

```bash
pnpm db:migrate
```

Then seed it with starter data (taste anchors, platform templates):

```bash
pnpm db:seed
```

---

## Running the app locally

You can run everything at once from the root folder:

```bash
pnpm dev
```

This starts:
- **API** at `http://localhost:3001`
- **Web** at `http://localhost:3000`
- **Mobile** — scan the QR code with the Expo Go app on your phone

Or run individual apps:

```bash
# API only
pnpm --filter api dev

# Web only
pnpm --filter web dev

# Mobile only
pnpm --filter mobile dev
```

---

## Understanding Git and GitHub

### What Git is

Git is a version control system — it tracks every change to every file. Think of it like Track Changes in Word, but for your entire codebase, with unlimited history.

### Key concepts

| Term | What it means |
|------|---------------|
| **Repository (repo)** | Your project folder, tracked by Git |
| **Commit** | A saved snapshot with a description of what changed |
| **Branch** | A separate line of development (we use `main`) |
| **Push** | Send your commits to GitHub (online backup) |
| **Pull** | Get the latest commits from GitHub |
| **Clone** | Download a repo from GitHub to your computer |

### What Claude does for you

Every time I finish a phase, I:
1. Write all the code files into your `StaffPicks` folder
2. Run `git add` to stage the changed files
3. Run `git commit -m "..."` to save a snapshot with a description
4. Run `git push` to send it to `github.com/mystaffpicks/staffpicks`

You can always see the full history at: **https://github.com/mystaffpicks/staffpicks/commits/main**

### If you want to look at the code on GitHub

1. Go to [github.com/mystaffpicks/staffpicks](https://github.com/mystaffpicks/staffpicks)
2. Click any file to read it
3. Click **Commits** to see the history of all changes
4. Click any commit to see exactly what changed (green = added, red = removed)

### If you make changes locally and want to save them

```bash
# See what changed
git status

# Stage everything
git add -A

# Save a snapshot
git commit -m "what I changed"

# Push to GitHub
git push
```

### If you want to undo your last commit (before pushing)

```bash
git reset --soft HEAD~1
```
This un-commits the last change but keeps your files as-is.

### If something goes wrong and you want to reset to the last GitHub version

```bash
git fetch origin
git reset --hard origin/main
```
⚠️ This will wipe any local changes you haven't pushed.

---

## Deploying to production

### Web app → Vercel (free)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **Add New Project** → import `mystaffpicks/staffpicks`
3. Set **Root Directory** to `apps/web`
4. Add your environment variables (same as `.env.local`)
5. Deploy — Vercel auto-deploys every time you push to `main`

### API server → Railway (free tier)

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. New Project → Deploy from GitHub repo → `mystaffpicks/staffpicks`
3. Set **Root Directory** to `apps/api`
4. Add your environment variables
5. Railway auto-deploys on every push to `main`

### Database → Railway or Supabase

Railway and Supabase both offer free PostgreSQL databases. Create one, copy the connection string, and paste it as `DATABASE_URL` in your API environment variables.

### Mobile app → Expo (TestFlight / Play Store)

You don't need a Mac. EAS Build compiles iOS apps in the cloud.

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login` (create a free Expo account at [expo.dev](https://expo.dev))
3. Build for iOS (cloud): `pnpm --filter mobile build:ios`
4. Build for Android: `pnpm --filter mobile build:android`
5. EAS emails you when the build is ready — download and submit to TestFlight / Play Store from your browser

> **Apple Developer account** ($99/year) is required to publish to the App Store or TestFlight. Google Play is a one-time $25 fee.

---

## Current build status

| Phase | What it does | Status |
|-------|-------------|--------|
| 0.1 | Monorepo scaffold | ✅ Done |
| 0.2 | Database schema + migrations | ✅ Done |
| 0.3 | Clerk authentication | ✅ Done |
| 1.1 | Content database + TMDB/YouTube | ✅ Done |
| 1.2 | Watch logging + My Shelf UI | 🔜 Next |
| 1.3 | Screenshot sync (Claude Vision) | 🔜 |
| 1.4 | Social layer + feed | 🔜 |
| 1.5 | Onboarding flow | 🔜 |

---

## Quick reference — commands you'll use most

```bash
# Install/update packages after pulling new code
pnpm install

# Start everything in development mode
pnpm dev

# Run database migrations (after schema changes)
pnpm db:migrate

# Push commits Claude made to GitHub
git push

# Pull latest changes from GitHub
git pull

# See what's changed locally
git status

# See recent commit history
git log --oneline -10
```

---

*Last updated: Phase 1.1 — Windows*
