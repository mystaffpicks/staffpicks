import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

export const contentTypeEnum = pgEnum('content_type', [
  'movie',
  'tv',
  'youtube',
  'tiktok',
  'podcast',
  'short',
  'other',
]);

export const content = pgTable(
  'content',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    content_type: contentTypeEnum('content_type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    thumbnail_url: text('thumbnail_url'),
    poster_url: text('poster_url'),
    external_ids: jsonb('external_ids').$type<{
      tmdb_id?: number;
      imdb_id?: string;
      youtube_id?: string;
      tiktok_id?: string;
    }>(),
    metadata: jsonb('metadata').$type<{
      year?: number;
      runtime_minutes?: number;
      season_count?: number;
      episode_count?: number;
      genres?: string[];
      rating?: string;
      channel_name?: string;
      duration_seconds?: number;
    }>(),
    platform_availability: jsonb('platform_availability').$type<
      Array<{ platform: string; url?: string; available_regions?: string[] }>
    >(),
    match_aliases: jsonb('match_aliases').$type<string[]>(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    titleIdx: index('content_title_idx').on(t.title),
    contentTypeIdx: index('content_type_idx').on(t.content_type),
  })
);

export type DbContent = typeof content.$inferSelect;
export type DbContentInsert = typeof content.$inferInsert;
