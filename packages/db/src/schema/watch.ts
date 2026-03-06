import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  integer,
  real,
  boolean,
  date,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { content } from './content.js';

export const watchStatusEnum = pgEnum('watch_status', [
  'watched',
  'watching',
  'dropped',
  'rewatching',
  'want_to_watch',
  'returned_early',
  'spotted',
]);

export const watchEntrySourceEnum = pgEnum('watch_entry_source', [
  'manual',
  'screenshot_sync',
  'share_link',
  'onboarding',
  'data_import',
]);

export const watchEntries = pgTable(
  'watch_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull(),
    content_id: uuid('content_id').notNull(),
    status: watchStatusEnum('status').notNull(),
    rating: integer('rating'),
    take: text('take'),
    mood_tags: jsonb('mood_tags').$type<string[]>().notNull().default([]),
    privacy_level: text('privacy_level').notNull().default('friends'),
    custom_audience_id: uuid('custom_audience_id'),
    hide_from_feed: boolean('hide_from_feed').notNull().default(false),
    rewatch_count: integer('rewatch_count').notNull().default(0),
    watched_on: date('watched_on'),
    platform: text('platform'),
    source: watchEntrySourceEnum('source').notNull().default('manual'),
    match_confidence: real('match_confidence'),

    // ── v2 additions ────────────────────────────────────────────────────────
    // Save/discovery context
    save_reason: text('save_reason'),
    save_reason_tag: text('save_reason_tag'), // friend_rec | trailer | trending | my_taste | custom
    // Post-watch mood
    post_watch_mood: text('post_watch_mood'), // blown_away | satisfied | meh | emotional | disappointed | processing
    // Review enrichment
    memorable_moment: text('memorable_moment'),
    would_recommend: text('would_recommend'), // yes | maybe | no
    // Returned-early fields
    returned_early_reason: text('returned_early_reason'), // lost_interest | too_slow | not_expected | too_heavy | life_busy | not_for_me | custom
    returned_early_note: text('returned_early_note'),
    // Spotted / ambient awareness
    spotted_location: text('spotted_location'),
    spotted_at: timestamp('spotted_at', { withTimezone: true }),
    // Source merge metadata
    merged_from_sources: jsonb('merged_from_sources').$type<Record<string, unknown>[]>(),
    // Spoiler controls
    spoiler_tagged: boolean('spoiler_tagged').notNull().default(false),
    spoiler_episode_ref: text('spoiler_episode_ref'),
    // ── end v2 ──────────────────────────────────────────────────────────────

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('watch_entries_user_id_idx').on(t.user_id),
    contentIdIdx: index('watch_entries_content_id_idx').on(t.content_id),
    userContentIdx: index('watch_entries_user_content_idx').on(t.user_id, t.content_id),
    createdAtIdx: index('watch_entries_created_at_idx').on(t.created_at),
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
    contentFk: foreignKey({ columns: [t.content_id], foreignColumns: [content.id] }),
  })
);

export const watchlistItems = pgTable(
  'watchlist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull(),
    content_id: uuid('content_id').notNull(),
    priority: text('priority').notNull().default('medium'),
    suggested_by_user_id: uuid('suggested_by_user_id'),
    suggestion_note: text('suggestion_note'),
    platform_preference: text('platform_preference'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('watchlist_user_id_idx').on(t.user_id),
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
    contentFk: foreignKey({ columns: [t.content_id], foreignColumns: [content.id] }),
  })
);

export type DbWatchEntry = typeof watchEntries.$inferSelect;
export type DbWatchEntryInsert = typeof watchEntries.$inferInsert;
export type DbWatchlistItem = typeof watchlistItems.$inferSelect;
export type DbWatchlistItemInsert = typeof watchlistItems.$inferInsert;
