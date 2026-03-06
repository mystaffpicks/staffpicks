import {
  pgTable,
  serial,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

// ─── User Gamification ────────────────────────────────────────────────────────
// Tracks stamps (currency), levels, streaks, and solve counts.
// One record per user — upserted on events.

export const userGamification = pgTable(
  'user_gamification',
  {
    user_id: uuid('user_id').primaryKey(),
    stamps: integer('stamps').notNull().default(0),
    level: integer('level').notNull().default(0),
    solves_count: integer('solves_count').notNull().default(0),
    current_streak: integer('current_streak').notNull().default(0),
    longest_streak: integer('longest_streak').notNull().default(0),
    stamps_history: jsonb('stamps_history').$type<
      Array<{ date: string; delta: number; reason: string }>
    >().notNull().default([]),
    weekly_solves: integer('weekly_solves').notNull().default(0),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
  })
);

// ─── Engagement Milestones ────────────────────────────────────────────────────
// Records when a user hits a notable engagement threshold, which can
// unlock free Gold Card months.

export const engagementMilestones = pgTable(
  'engagement_milestones',
  {
    id: serial('id').primaryKey(),
    user_id: uuid('user_id').notNull(),
    milestone_type: text('milestone_type').notNull(),  // e.g. '50_watches', 'streak_30', '1st_solve'
    achieved_at: timestamp('achieved_at', { withTimezone: true }).notNull().defaultNow(),
    reward_months: real('reward_months').notNull(),      // fractional months of Gold to grant
    reward_applied: boolean('reward_applied').notNull().default(false),
    phase: integer('phase').notNull().default(1),       // product phase when milestone was reached
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('engagement_milestones_user_idx').on(t.user_id),
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
  })
);

// ─── Gold Card Credits ────────────────────────────────────────────────────────
// Individual credit entries that compose a user's Gold Card entitlement.
// Sources: milestone reward, referral, promotion, purchase.

export const goldCardCredits = pgTable(
  'gold_card_credits',
  {
    id: serial('id').primaryKey(),
    user_id: uuid('user_id').notNull(),
    // source: milestone | referral | promotion | purchase
    source: text('source').notNull(),
    months_credited: real('months_credited').notNull(),
    starts_at: date('starts_at').notNull(),
    expires_at: date('expires_at').notNull(),
    milestone_id: integer('milestone_id'),   // FK to engagement_milestones when source=milestone
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('gold_card_credits_user_idx').on(t.user_id),
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
    milestoneFk: foreignKey({
      columns: [t.milestone_id],
      foreignColumns: [engagementMilestones.id],
    }),
  })
);

export type DbUserGamification = typeof userGamification.$inferSelect;
export type DbEngagementMilestone = typeof engagementMilestones.$inferSelect;
export type DbGoldCardCredit = typeof goldCardCredits.$inferSelect;
