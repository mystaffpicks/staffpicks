import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const syncStatusEnum = pgEnum('sync_status', [
  'pending',
  'processing',
  'review',
  'confirmed',
  'failed',
]);

export const screenshotSyncs = pgTable(
  'screenshot_syncs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull(),
    image_url: text('image_url').notNull(),
    detected_platform: text('detected_platform'),
    extracted_items: jsonb('extracted_items').$type<unknown[]>().notNull().default([]),
    confirmed_items: jsonb('confirmed_items').$type<unknown[]>().notNull().default([]),
    processing_status: syncStatusEnum('processing_status').notNull().default('pending'),
    processed_at: timestamp('processed_at', { withTimezone: true }),
    confirmed_at: timestamp('confirmed_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('screenshot_syncs_user_idx').on(t.user_id),
    statusIdx: index('screenshot_syncs_status_idx').on(t.processing_status),
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
  })
);

export const platformPromptTemplates = pgTable('platform_prompt_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  platform: text('platform').notNull(),
  version: integer('version').notNull().default(1),
  prompt_text: text('prompt_text').notNull(),
  ui_description: text('ui_description'),
  active: boolean('active').notNull().default(true),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

import { integer, boolean } from 'drizzle-orm/pg-core';

export type DbScreenshotSync = typeof screenshotSyncs.$inferSelect;
export type DbPlatformPromptTemplate = typeof platformPromptTemplates.$inferSelect;
