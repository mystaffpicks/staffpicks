import {
  pgTable,
  serial,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  unique,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { content } from './content.js';

// ─── Collections ──────────────────────────────────────────────────────────────
// User-curated or auto-generated lists of content (e.g. "Films I've watched
// with Dad", "Dark comedies", auto-generated "Watched in 2025").

export const collections = pgTable(
  'collections',
  {
    id: serial('id').primaryKey(),
    owner_user_id: uuid('owner_user_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    cover_content_id: uuid('cover_content_id'),   // FK to content (optional hero poster)
    collection_type: text('collection_type').notNull().default('custom'), // auto | custom | shared
    visibility: text('visibility').notNull().default('private'),           // private | shared | public
    auto_filter: jsonb('auto_filter').$type<Record<string, unknown>>(),    // for auto-generated collections
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index('collections_owner_idx').on(t.owner_user_id),
    ownerFk: foreignKey({ columns: [t.owner_user_id], foreignColumns: [users.id] }),
    coverFk: foreignKey({ columns: [t.cover_content_id], foreignColumns: [content.id] }),
  })
);

// ─── Collection Items ─────────────────────────────────────────────────────────

export const collectionItems = pgTable(
  'collection_items',
  {
    id: serial('id').primaryKey(),
    collection_id: serial('collection_id').notNull(),
    content_id: uuid('content_id').notNull(),
    added_by_user_id: uuid('added_by_user_id').notNull(),
    note: text('note'),
    added_at: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    collectionIdx: index('collection_items_collection_idx').on(t.collection_id),
    uniqCollectionContent: unique('collection_items_unique').on(t.collection_id, t.content_id),
    collectionFk: foreignKey({ columns: [t.collection_id], foreignColumns: [collections.id] }),
    contentFk: foreignKey({ columns: [t.content_id], foreignColumns: [content.id] }),
    addedByFk: foreignKey({ columns: [t.added_by_user_id], foreignColumns: [users.id] }),
  })
);

// ─── Collection Members ───────────────────────────────────────────────────────
// Tracks who has access to a shared collection and at what role level.

export const collectionMembers = pgTable(
  'collection_members',
  {
    id: serial('id').primaryKey(),
    collection_id: serial('collection_id').notNull(),
    user_id: uuid('user_id').notNull(),
    role: text('role').notNull().default('editor'), // owner | editor | viewer
    added_at: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    collectionIdx: index('collection_members_collection_idx').on(t.collection_id),
    uniqCollectionUser: unique('collection_members_unique').on(t.collection_id, t.user_id),
    collectionFk: foreignKey({ columns: [t.collection_id], foreignColumns: [collections.id] }),
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
  })
);

export type DbCollection = typeof collections.$inferSelect;
export type DbCollectionInsert = typeof collections.$inferInsert;
export type DbCollectionItem = typeof collectionItems.$inferSelect;
export type DbCollectionMember = typeof collectionMembers.$inferSelect;
