import {
  pgTable,
  serial,
  uuid,
  text,
  integer,
  real,
  timestamp,
  date,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { content } from './content.js';

// ─── Redder Picks ─────────────────────────────────────────────────────────────
// Weekly AI-generated personalised recommendations for each user.
// "Redder" is the AI persona that surfaces these picks.

export const redderPicks = pgTable(
  'redder_picks',
  {
    id: serial('id').primaryKey(),
    user_id: uuid('user_id').notNull(),
    content_id: uuid('content_id').notNull(),
    generation_week: date('generation_week').notNull(),  // ISO week start date (Monday)
    redders_take: text('redders_take').notNull(),         // AI-written blurb for this user
    // category: comfort | discovery | wildcard
    category: text('category').notNull(),
    quality_score: real('quality_score'),                 // model confidence 0-1
    // user_response: queued | watched | returned_early | dismissed | ignored
    user_response: text('user_response'),
    // dismissed_reason: not_my_genre | seen_it | too_long | not_in_mood | looks_bad
    dismissed_reason: text('dismissed_reason'),
    responded_at: timestamp('responded_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('redder_picks_user_idx').on(t.user_id),
    weekIdx: index('redder_picks_week_idx').on(t.user_id, t.generation_week),
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
    contentFk: foreignKey({ columns: [t.content_id], foreignColumns: [content.id] }),
  })
);

// ─── Redder Accuracy ──────────────────────────────────────────────────────────
// Running accuracy score for how well Redder's picks land with this user.
// Updated after each user response.

export const redderAccuracy = pgTable(
  'redder_accuracy',
  {
    user_id: uuid('user_id').primaryKey(),
    total_picks: integer('total_picks').notNull().default(0),
    positive_responses: integer('positive_responses').notNull().default(0),   // queued | watched
    negative_responses: integer('negative_responses').notNull().default(0),   // dismissed | returned_early
    accuracy_percentage: real('accuracy_percentage').notNull().default(0),
    last_generated_at: timestamp('last_generated_at', { withTimezone: true }),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
  })
);

export type DbRedderPick = typeof redderPicks.$inferSelect;
export type DbRedderAccuracy = typeof redderAccuracy.$inferSelect;
