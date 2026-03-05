import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
  primaryKey,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const followStatusEnum = pgEnum('follow_status', ['following', 'pending', 'blocked']);

export const follows = pgTable(
  'follows',
  {
    follower_id: uuid('follower_id').notNull(),
    following_id: uuid('following_id').notNull(),
    status: followStatusEnum('status').notNull().default('following'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.follower_id, t.following_id] }),
    followerIdx: index('follows_follower_idx').on(t.follower_id),
    followingIdx: index('follows_following_idx').on(t.following_id),
    followerFk: foreignKey({ columns: [t.follower_id], foreignColumns: [users.id] }),
    followingFk: foreignKey({ columns: [t.following_id], foreignColumns: [users.id] }),
  })
);

export const interactions = pgTable(
  'interactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull(),
    target_type: text('target_type').notNull(), // 'watch_entry' | 'clip' | 'user'
    target_id: uuid('target_id').notNull(),
    interaction_type: text('interaction_type').notNull(), // 'like' | 'comment' | 'fire'
    content: text('content'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('interactions_user_idx').on(t.user_id),
    targetIdx: index('interactions_target_idx').on(t.target_type, t.target_id),
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
  })
);

export type DbFollow = typeof follows.$inferSelect;
export type DbInteraction = typeof interactions.$inferSelect;
