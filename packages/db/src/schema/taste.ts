import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  real,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { content } from './content.js';

export const tasteAnchors = pgTable(
  'taste_anchors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    content_id: uuid('content_id').notNull(),
    cluster: text('cluster').notNull(), // e.g. 'prestige_tv', 'reality', 'true_crime'
    related_content_ids: jsonb('related_content_ids').$type<string[]>().notNull().default([]),
    discriminating_power: real('discriminating_power').notNull().default(0.5),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    contentIdIdx: index('taste_anchors_content_idx').on(t.content_id),
    clusterIdx: index('taste_anchors_cluster_idx').on(t.cluster),
    contentFk: foreignKey({ columns: [t.content_id], foreignColumns: [content.id] }),
  })
);

export type DbTasteAnchor = typeof tasteAnchors.$inferSelect;
export type DbTasteAnchorInsert = typeof tasteAnchors.$inferInsert;
