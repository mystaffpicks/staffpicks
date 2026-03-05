import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ContentTypeSchema = z.enum([
  'movie',
  'tv',
  'youtube',
  'tiktok',
  'podcast',
  'short',
  'other',
]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const PlatformSchema = z.enum([
  'netflix',
  'youtube',
  'disney_plus',
  'hulu',
  'apple_tv',
  'hbo_max',
  'amazon_prime',
  'peacock',
  'paramount_plus',
  'tiktok',
  'spotify',
  'other',
]);
export type Platform = z.infer<typeof PlatformSchema>;

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const ExternalIdsSchema = z.object({
  tmdb_id: z.number().optional(),
  imdb_id: z.string().optional(),
  youtube_id: z.string().optional(),
  tiktok_id: z.string().optional(),
});
export type ExternalIds = z.infer<typeof ExternalIdsSchema>;

export const PlatformAvailabilitySchema = z.object({
  platform: PlatformSchema,
  url: z.string().url().optional(),
  available_regions: z.array(z.string()).optional(),
});
export type PlatformAvailability = z.infer<typeof PlatformAvailabilitySchema>;

export const ContentSchema = z.object({
  id: z.string().uuid(),
  content_type: ContentTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  thumbnail_url: z.string().url().nullable(),
  poster_url: z.string().url().nullable(),
  external_ids: ExternalIdsSchema.optional(),
  metadata: z
    .object({
      year: z.number().optional(),
      runtime_minutes: z.number().optional(),
      season_count: z.number().optional(),
      episode_count: z.number().optional(),
      genres: z.array(z.string()).optional(),
      rating: z.string().optional(),
      channel_name: z.string().optional(),
      duration_seconds: z.number().optional(),
    })
    .optional(),
  platform_availability: z.array(PlatformAvailabilitySchema).optional(),
  match_aliases: z.array(z.string()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Content = z.infer<typeof ContentSchema>;

export const ContentSearchResultSchema = ContentSchema.extend({
  match_score: z.number().optional(),
  source: z.enum(['local', 'tmdb', 'youtube']).optional(),
});
export type ContentSearchResult = z.infer<typeof ContentSearchResultSchema>;
