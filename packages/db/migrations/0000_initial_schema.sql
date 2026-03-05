-- StaffPicks — Initial Schema Migration
-- Generated: 2026-03-05
-- Run with: pnpm db:migrate

-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- fuzzy text search on titles

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "privacy_level" AS ENUM ('public', 'friends', 'private');
CREATE TYPE "content_type" AS ENUM ('movie', 'tv', 'youtube', 'tiktok', 'podcast', 'short', 'other');
CREATE TYPE "watch_status" AS ENUM ('watched', 'watching', 'dropped', 'rewatching');
CREATE TYPE "watch_entry_source" AS ENUM ('manual', 'screenshot_sync', 'share_link', 'onboarding', 'data_import');
CREATE TYPE "follow_status" AS ENUM ('following', 'pending', 'blocked');
CREATE TYPE "sync_status" AS ENUM ('pending', 'processing', 'review', 'confirmed', 'failed');

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE "users" (
  "id"                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clerk_id"                      TEXT NOT NULL UNIQUE,
  "username"                      TEXT NOT NULL UNIQUE,
  "display_name"                  TEXT NOT NULL,
  "avatar_url"                    TEXT,
  "bio"                           TEXT,
  "email"                         TEXT NOT NULL UNIQUE,
  "default_privacy_level"         "privacy_level" NOT NULL DEFAULT 'friends',
  "content_type_privacy_defaults" JSONB,
  "enabled_platforms"             JSONB NOT NULL DEFAULT '[]',
  "taste_profile"                 JSONB,
  "sync_reminder_time"            TEXT NOT NULL DEFAULT '21:00',
  "onboarding_completed"          BOOLEAN NOT NULL DEFAULT FALSE,
  "push_token"                    TEXT,
  "created_at"                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "users_username_idx"  ON "users" ("username");
CREATE INDEX "users_clerk_id_idx"  ON "users" ("clerk_id");

-- ─── Content ──────────────────────────────────────────────────────────────────

CREATE TABLE "content" (
  "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "content_type"          "content_type" NOT NULL,
  "title"                 TEXT NOT NULL,
  "description"           TEXT,
  "thumbnail_url"         TEXT,
  "poster_url"            TEXT,
  "external_ids"          JSONB,
  "metadata"              JSONB,
  "platform_availability" JSONB,
  "match_aliases"         JSONB,
  "created_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Standard index for exact lookups
CREATE INDEX "content_title_idx"       ON "content" ("title");
CREATE INDEX "content_type_idx"        ON "content" ("content_type");

-- GIN index for JSONB metadata queries
CREATE INDEX "content_external_ids_idx"    ON "content" USING GIN ("external_ids");
CREATE INDEX "content_platform_avail_idx"  ON "content" USING GIN ("platform_availability");

-- Trigram index for fuzzy title search
CREATE INDEX "content_title_trgm_idx"  ON "content" USING GIN ("title" gin_trgm_ops);

-- ─── Watch Entries ────────────────────────────────────────────────────────────

CREATE TABLE "watch_entries" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"           UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content_id"        UUID NOT NULL REFERENCES "content"("id") ON DELETE CASCADE,
  "status"            "watch_status" NOT NULL,
  "rating"            INTEGER CHECK ("rating" BETWEEN 1 AND 10),
  "take"              TEXT,
  "mood_tags"         JSONB NOT NULL DEFAULT '[]',
  "privacy_level"     "privacy_level" NOT NULL DEFAULT 'friends',
  "custom_audience_id" UUID,
  "hide_from_feed"    BOOLEAN NOT NULL DEFAULT FALSE,
  "rewatch_count"     INTEGER NOT NULL DEFAULT 0,
  "watched_on"        DATE,
  "platform"          TEXT,
  "source"            "watch_entry_source" NOT NULL DEFAULT 'manual',
  "match_confidence"  REAL,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "watch_entries_user_id_idx"      ON "watch_entries" ("user_id");
CREATE INDEX "watch_entries_content_id_idx"   ON "watch_entries" ("content_id");
CREATE INDEX "watch_entries_user_content_idx" ON "watch_entries" ("user_id", "content_id");
CREATE INDEX "watch_entries_created_at_idx"   ON "watch_entries" ("created_at" DESC);
CREATE INDEX "watch_entries_status_idx"       ON "watch_entries" ("status");

-- Unique: one active entry per user per content (allow multiple with different created_at for rewatches)
-- Not enforced at DB level — handled in app logic

-- ─── Watchlist Items ──────────────────────────────────────────────────────────

CREATE TABLE "watchlist_items" (
  "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"               UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content_id"            UUID NOT NULL REFERENCES "content"("id") ON DELETE CASCADE,
  "priority"              TEXT NOT NULL DEFAULT 'medium',
  "suggested_by_user_id"  UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "suggestion_note"       TEXT,
  "platform_preference"   TEXT,
  "created_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("user_id", "content_id")
);

CREATE INDEX "watchlist_user_id_idx" ON "watchlist_items" ("user_id");

-- ─── Follows ──────────────────────────────────────────────────────────────────

CREATE TABLE "follows" (
  "follower_id"   UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "following_id"  UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status"        "follow_status" NOT NULL DEFAULT 'following',
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("follower_id", "following_id")
);

CREATE INDEX "follows_follower_idx"  ON "follows" ("follower_id");
CREATE INDEX "follows_following_idx" ON "follows" ("following_id");

-- ─── Interactions ─────────────────────────────────────────────────────────────

CREATE TABLE "interactions" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"          UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "target_type"      TEXT NOT NULL,
  "target_id"        UUID NOT NULL,
  "interaction_type" TEXT NOT NULL,
  "content"          TEXT,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "interactions_user_idx"   ON "interactions" ("user_id");
CREATE INDEX "interactions_target_idx" ON "interactions" ("target_type", "target_id");

-- ─── Screenshot Syncs ─────────────────────────────────────────────────────────

CREATE TABLE "screenshot_syncs" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"           UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "image_url"         TEXT NOT NULL,
  "detected_platform" TEXT,
  "extracted_items"   JSONB NOT NULL DEFAULT '[]',
  "confirmed_items"   JSONB NOT NULL DEFAULT '[]',
  "processing_status" "sync_status" NOT NULL DEFAULT 'pending',
  "processed_at"      TIMESTAMPTZ,
  "confirmed_at"      TIMESTAMPTZ,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "screenshot_syncs_user_idx"   ON "screenshot_syncs" ("user_id");
CREATE INDEX "screenshot_syncs_status_idx" ON "screenshot_syncs" ("processing_status");

-- ─── Platform Prompt Templates ────────────────────────────────────────────────

CREATE TABLE "platform_prompt_templates" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "platform"       TEXT NOT NULL,
  "version"        INTEGER NOT NULL DEFAULT 1,
  "prompt_text"    TEXT NOT NULL,
  "ui_description" TEXT,
  "active"         BOOLEAN NOT NULL DEFAULT TRUE,
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "platform_prompts_platform_idx" ON "platform_prompt_templates" ("platform", "active");

-- ─── Taste Anchors ────────────────────────────────────────────────────────────

CREATE TABLE "taste_anchors" (
  "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "content_id"           UUID NOT NULL REFERENCES "content"("id") ON DELETE CASCADE,
  "cluster"              TEXT NOT NULL,
  "related_content_ids"  JSONB NOT NULL DEFAULT '[]',
  "discriminating_power" REAL NOT NULL DEFAULT 0.5,
  "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "taste_anchors_content_idx" ON "taste_anchors" ("content_id");
CREATE INDEX "taste_anchors_cluster_idx" ON "taste_anchors" ("cluster");

-- ─── Updated At Trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON "content"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watch_entries_updated_at
  BEFORE UPDATE ON "watch_entries"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
