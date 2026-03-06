import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

export const privacyLevelEnum = pgEnum('privacy_level', ['public', 'friends', 'private']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerk_id: text('clerk_id').notNull().unique(),
    username: text('username').notNull().unique(),
    display_name: text('display_name').notNull(),
    avatar_url: text('avatar_url'),
    bio: text('bio'),
    email: text('email').notNull().unique(),
    default_privacy_level: privacyLevelEnum('default_privacy_level').notNull().default('friends'),
    content_type_privacy_defaults: jsonb('content_type_privacy_defaults').$type<
      Record<string, string>
    >(),
    enabled_platforms: jsonb('enabled_platforms').$type<string[]>().notNull().default([]),
    taste_profile: jsonb('taste_profile').$type<Record<string, unknown>>(),
    sync_reminder_time: text('sync_reminder_time').notNull().default('21:00'),
    onboarding_completed: boolean('onboarding_completed').notNull().default(false),
    push_token: text('push_token'),

    // ── v2 additions: age / legal compliance ────────────────────────────────
    age_bracket: text('age_bracket'),              // '13-17' | '18+'
    is_minor: boolean('is_minor').notNull().default(false),
    tos_accepted_at: timestamp('tos_accepted_at', { withTimezone: true }),
    tos_version: text('tos_version'),
    privacy_policy_accepted_at: timestamp('privacy_policy_accepted_at', { withTimezone: true }),
    privacy_policy_version: text('privacy_policy_version'),
    children_content_confirmed: boolean('children_content_confirmed').notNull().default(false),

    // ── v2 additions: spoiler preferences ───────────────────────────────────
    spoiler_mode: text('spoiler_mode').notNull().default('standard'), // strict | standard | off
    spoiler_window_movies: integer('spoiler_window_movies').notNull().default(7),   // days
    spoiler_window_weekly: integer('spoiler_window_weekly').notNull().default(3),   // days
    spoiler_window_season: integer('spoiler_window_season').notNull().default(14),  // days
    // ── end v2 ──────────────────────────────────────────────────────────────

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    usernameIdx: index('users_username_idx').on(t.username),
    clerkIdIdx: index('users_clerk_id_idx').on(t.clerk_id),
  })
);

export type DbUser = typeof users.$inferSelect;
export type DbUserInsert = typeof users.$inferInsert;
