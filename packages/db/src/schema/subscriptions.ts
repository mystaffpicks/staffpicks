import {
  pgTable,
  serial,
  uuid,
  text,
  integer,
  boolean,
  real,
  timestamp,
  date,
  jsonb,
  unique,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { content } from './content.js';

// ─── User Subscriptions ───────────────────────────────────────────────────────
// Tracks a user's current subscription tier (free Member vs paid Gold Card).
// Combines trial state, provider info, and expiry in one row per user.

export const userSubscriptions = pgTable(
  'user_subscriptions',
  {
    user_id: uuid('user_id').primaryKey(),
    // tier: member | gold
    tier: text('tier').notNull().default('member'),
    // provider: apple | google | stripe (null for member tier)
    provider: text('provider'),
    provider_subscription_id: text('provider_subscription_id'),
    started_at: timestamp('started_at', { withTimezone: true }),
    expires_at: timestamp('expires_at', { withTimezone: true }),
    is_trial: boolean('is_trial').notNull().default(false),
    trial_ends_at: timestamp('trial_ends_at', { withTimezone: true }),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
  })
);

// ─── Spoiler Windows ──────────────────────────────────────────────────────────
// Per-content spoiler protection periods. The app checks these before
// rendering user reviews/takes in feeds.

export const spoilerWindows = pgTable(
  'spoiler_windows',
  {
    id: serial('id').primaryKey(),
    content_id: uuid('content_id').notNull(),
    // release_type: movie | weekly_episode | full_season_drop
    release_type: text('release_type').notNull(),
    release_date: date('release_date').notNull(),
    window_days: integer('window_days').notNull(),
    expires_at: date('expires_at').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    contentIdx: index('spoiler_windows_content_idx').on(t.content_id),
    contentFk: foreignKey({ columns: [t.content_id], foreignColumns: [content.id] }),
  })
);

// ─── Year in Reviews ──────────────────────────────────────────────────────────
// Stores the generated "Year in Review" card data per user per year.

export const yearInReviews = pgTable(
  'year_in_reviews',
  {
    id: serial('id').primaryKey(),
    user_id: uuid('user_id').notNull(),
    year: integer('year').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull(),  // stats, top picks, etc.
    cards_generated: boolean('cards_generated').notNull().default(false),
    shared_count: integer('shared_count').notNull().default(0),
    generated_at: timestamp('generated_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userYearUniq: unique('year_in_reviews_user_year_unique').on(t.user_id, t.year),
    userIdx: index('year_in_reviews_user_idx').on(t.user_id),
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
  })
);

export type DbUserSubscription = typeof userSubscriptions.$inferSelect;
export type DbSpoilerWindow = typeof spoilerWindows.$inferSelect;
export type DbYearInReview = typeof yearInReviews.$inferSelect;
