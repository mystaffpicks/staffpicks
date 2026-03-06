-- StaffPicks — Schema v2 Migration
-- Generated: 2026-03-06
-- Run with: pnpm db:migrate
--
-- Adds:
--   • 3 extended enum values on watch_status
--   • ~12 new columns on watch_entries
--   • 3 new columns on content  (parent_id, episode_number, season_number)
--   • 11 new columns on users   (age/legal compliance + spoiler preferences)
--   • 15 new tables:
--       collections, collection_items, collection_members,
--       consent_records, content_reports,
--       patron_questions, patron_answers,
--       user_gamification, engagement_milestones, gold_card_credits,
--       redder_picks, redder_accuracy,
--       user_subscriptions, spoiler_windows, year_in_reviews

-- ─── Enum Additions ────────────────────────────────────────────────────────────
-- PostgreSQL requires ADD VALUE to be committed before it can be used in the
-- same session, but Supabase/PG 15 allows this inside a transaction.

ALTER TYPE "watch_status" ADD VALUE IF NOT EXISTS 'want_to_watch';
ALTER TYPE "watch_status" ADD VALUE IF NOT EXISTS 'returned_early';
ALTER TYPE "watch_status" ADD VALUE IF NOT EXISTS 'spotted';

-- ─── watch_entries — new columns ───────────────────────────────────────────────

ALTER TABLE "watch_entries"
  ADD COLUMN IF NOT EXISTS "save_reason"           TEXT,
  ADD COLUMN IF NOT EXISTS "save_reason_tag"        TEXT,
  ADD COLUMN IF NOT EXISTS "post_watch_mood"        TEXT,
  ADD COLUMN IF NOT EXISTS "memorable_moment"       TEXT,
  ADD COLUMN IF NOT EXISTS "would_recommend"        TEXT,
  ADD COLUMN IF NOT EXISTS "returned_early_reason"  TEXT,
  ADD COLUMN IF NOT EXISTS "returned_early_note"    TEXT,
  ADD COLUMN IF NOT EXISTS "spotted_location"       TEXT,
  ADD COLUMN IF NOT EXISTS "spotted_at"             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "merged_from_sources"    JSONB,
  ADD COLUMN IF NOT EXISTS "spoiler_tagged"         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "spoiler_episode_ref"    TEXT;

-- ─── content — new columns ─────────────────────────────────────────────────────

ALTER TABLE "content"
  ADD COLUMN IF NOT EXISTS "parent_id"        UUID,
  ADD COLUMN IF NOT EXISTS "episode_number"   INTEGER,
  ADD COLUMN IF NOT EXISTS "season_number"    INTEGER;

CREATE INDEX IF NOT EXISTS "content_parent_id_idx"
  ON "content" ("parent_id");

ALTER TABLE "content"
  ADD CONSTRAINT "content_parent_id_fk"
  FOREIGN KEY ("parent_id") REFERENCES "content"("id")
  NOT VALID;  -- skip validation for existing rows (all NULL)

-- ─── users — new columns ───────────────────────────────────────────────────────

ALTER TABLE "users"
  -- Age & legal compliance
  ADD COLUMN IF NOT EXISTS "age_bracket"                   TEXT,
  ADD COLUMN IF NOT EXISTS "is_minor"                      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "tos_accepted_at"               TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "tos_version"                   TEXT,
  ADD COLUMN IF NOT EXISTS "privacy_policy_accepted_at"    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "privacy_policy_version"        TEXT,
  ADD COLUMN IF NOT EXISTS "children_content_confirmed"    BOOLEAN NOT NULL DEFAULT FALSE,
  -- Spoiler preferences
  ADD COLUMN IF NOT EXISTS "spoiler_mode"                  TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS "spoiler_window_movies"         INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS "spoiler_window_weekly"         INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "spoiler_window_season"         INTEGER NOT NULL DEFAULT 14;

-- ─── Collections ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "collections" (
  "id"               SERIAL PRIMARY KEY,
  "owner_user_id"    UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name"             TEXT NOT NULL,
  "description"      TEXT,
  "cover_content_id" UUID REFERENCES "content"("id") ON DELETE SET NULL,
  "collection_type"  TEXT NOT NULL DEFAULT 'custom',
  "visibility"       TEXT NOT NULL DEFAULT 'private',
  "auto_filter"      JSONB,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "collections_owner_idx"
  ON "collections" ("owner_user_id");

-- ─── Collection Items ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "collection_items" (
  "id"                SERIAL PRIMARY KEY,
  "collection_id"     INTEGER NOT NULL REFERENCES "collections"("id") ON DELETE CASCADE,
  "content_id"        UUID NOT NULL REFERENCES "content"("id") ON DELETE CASCADE,
  "added_by_user_id"  UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "note"              TEXT,
  "added_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("collection_id", "content_id")
);

CREATE INDEX IF NOT EXISTS "collection_items_collection_idx"
  ON "collection_items" ("collection_id");

-- ─── Collection Members ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "collection_members" (
  "id"             SERIAL PRIMARY KEY,
  "collection_id"  INTEGER NOT NULL REFERENCES "collections"("id") ON DELETE CASCADE,
  "user_id"        UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role"           TEXT NOT NULL DEFAULT 'editor',
  "added_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("collection_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "collection_members_collection_idx"
  ON "collection_members" ("collection_id");

-- ─── Consent Records ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "consent_records" (
  "id"               SERIAL PRIMARY KEY,
  "user_id"          UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "consent_type"     TEXT NOT NULL,
  "granted"          BOOLEAN NOT NULL,
  "granted_at"       TIMESTAMPTZ,
  "revoked_at"       TIMESTAMPTZ,
  "consent_version"  TEXT NOT NULL,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "consent_records_user_idx"
  ON "consent_records" ("user_id");
CREATE INDEX IF NOT EXISTS "consent_records_user_type_idx"
  ON "consent_records" ("user_id", "consent_type");

-- ─── Content Reports ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "content_reports" (
  "id"                  SERIAL PRIMARY KEY,
  "reporter_user_id"    UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "target_type"         TEXT NOT NULL,
  "target_id"           INTEGER NOT NULL,
  "category"            TEXT NOT NULL,
  "description"         TEXT,
  "status"              TEXT NOT NULL DEFAULT 'pending',
  "action_taken"        TEXT,
  "reviewed_by"         TEXT,
  "reviewed_at"         TIMESTAMPTZ,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "content_reports_reporter_idx"
  ON "content_reports" ("reporter_user_id");
CREATE INDEX IF NOT EXISTS "content_reports_status_idx"
  ON "content_reports" ("status");
CREATE INDEX IF NOT EXISTS "content_reports_target_idx"
  ON "content_reports" ("target_type", "target_id");

-- ─── Patron Questions ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "patron_questions" (
  "id"                  SERIAL PRIMARY KEY,
  "asker_user_id"       UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "query_text"          TEXT NOT NULL,
  "hints"               JSONB,
  "ai_rejected_matches" JSONB,
  "status"              TEXT NOT NULL DEFAULT 'open',
  "solved_by_user_id"   UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "solved_content_id"   UUID REFERENCES "content"("id") ON DELETE SET NULL,
  "visibility"          TEXT NOT NULL DEFAULT 'friends',
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "solved_at"           TIMESTAMPTZ,
  "expires_at"          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "patron_questions_asker_idx"
  ON "patron_questions" ("asker_user_id");
CREATE INDEX IF NOT EXISTS "patron_questions_status_idx"
  ON "patron_questions" ("status");

-- ─── Patron Answers ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "patron_answers" (
  "id"                  SERIAL PRIMARY KEY,
  "question_id"         INTEGER NOT NULL REFERENCES "patron_questions"("id") ON DELETE CASCADE,
  "answerer_user_id"    UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content_id"          UUID NOT NULL REFERENCES "content"("id") ON DELETE CASCADE,
  "note"                TEXT,
  "status"              TEXT NOT NULL DEFAULT 'pending',
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "patron_answers_question_idx"
  ON "patron_answers" ("question_id");
CREATE INDEX IF NOT EXISTS "patron_answers_answerer_idx"
  ON "patron_answers" ("answerer_user_id");

-- ─── User Gamification ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "user_gamification" (
  "user_id"          UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "stamps"           INTEGER NOT NULL DEFAULT 0,
  "level"            INTEGER NOT NULL DEFAULT 0,
  "solves_count"     INTEGER NOT NULL DEFAULT 0,
  "current_streak"   INTEGER NOT NULL DEFAULT 0,
  "longest_streak"   INTEGER NOT NULL DEFAULT 0,
  "stamps_history"   JSONB NOT NULL DEFAULT '[]',
  "weekly_solves"    INTEGER NOT NULL DEFAULT 0,
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Engagement Milestones ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "engagement_milestones" (
  "id"               SERIAL PRIMARY KEY,
  "user_id"          UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "milestone_type"   TEXT NOT NULL,
  "achieved_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "reward_months"    REAL NOT NULL,
  "reward_applied"   BOOLEAN NOT NULL DEFAULT FALSE,
  "phase"            INTEGER NOT NULL DEFAULT 1,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "engagement_milestones_user_idx"
  ON "engagement_milestones" ("user_id");

-- ─── Gold Card Credits ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "gold_card_credits" (
  "id"               SERIAL PRIMARY KEY,
  "user_id"          UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "source"           TEXT NOT NULL,
  "months_credited"  REAL NOT NULL,
  "starts_at"        DATE NOT NULL,
  "expires_at"       DATE NOT NULL,
  "milestone_id"     INTEGER REFERENCES "engagement_milestones"("id") ON DELETE SET NULL,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "gold_card_credits_user_idx"
  ON "gold_card_credits" ("user_id");

-- ─── Redder Picks ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "redder_picks" (
  "id"                SERIAL PRIMARY KEY,
  "user_id"           UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content_id"        UUID NOT NULL REFERENCES "content"("id") ON DELETE CASCADE,
  "generation_week"   DATE NOT NULL,
  "redders_take"      TEXT NOT NULL,
  "category"          TEXT NOT NULL,
  "quality_score"     REAL,
  "user_response"     TEXT,
  "dismissed_reason"  TEXT,
  "responded_at"      TIMESTAMPTZ,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "redder_picks_user_idx"
  ON "redder_picks" ("user_id");
CREATE INDEX IF NOT EXISTS "redder_picks_week_idx"
  ON "redder_picks" ("user_id", "generation_week");

-- ─── Redder Accuracy ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "redder_accuracy" (
  "user_id"              UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "total_picks"          INTEGER NOT NULL DEFAULT 0,
  "positive_responses"   INTEGER NOT NULL DEFAULT 0,
  "negative_responses"   INTEGER NOT NULL DEFAULT 0,
  "accuracy_percentage"  REAL NOT NULL DEFAULT 0,
  "last_generated_at"    TIMESTAMPTZ,
  "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── User Subscriptions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "user_subscriptions" (
  "user_id"                   UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "tier"                      TEXT NOT NULL DEFAULT 'member',
  "provider"                  TEXT,
  "provider_subscription_id"  TEXT,
  "started_at"                TIMESTAMPTZ,
  "expires_at"                TIMESTAMPTZ,
  "is_trial"                  BOOLEAN NOT NULL DEFAULT FALSE,
  "trial_ends_at"             TIMESTAMPTZ,
  "updated_at"                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Spoiler Windows ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "spoiler_windows" (
  "id"            SERIAL PRIMARY KEY,
  "content_id"    UUID NOT NULL REFERENCES "content"("id") ON DELETE CASCADE,
  "release_type"  TEXT NOT NULL,
  "release_date"  DATE NOT NULL,
  "window_days"   INTEGER NOT NULL,
  "expires_at"    DATE NOT NULL,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "spoiler_windows_content_idx"
  ON "spoiler_windows" ("content_id");

-- ─── Year in Reviews ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "year_in_reviews" (
  "id"               SERIAL PRIMARY KEY,
  "user_id"          UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "year"             INTEGER NOT NULL,
  "data"             JSONB NOT NULL,
  "cards_generated"  BOOLEAN NOT NULL DEFAULT FALSE,
  "shared_count"     INTEGER NOT NULL DEFAULT 0,
  "generated_at"     TIMESTAMPTZ,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("user_id", "year")
);

CREATE INDEX IF NOT EXISTS "year_in_reviews_user_idx"
  ON "year_in_reviews" ("user_id");
