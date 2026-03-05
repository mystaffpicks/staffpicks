import { z } from 'zod';
import { PlatformSchema, PrivacyLevelSchema } from './content.js';
import { ContentSchema } from './content.js';
import { PublicUserSchema } from './user.js';

export const WatchStatusSchema = z.enum(['watched', 'watching', 'dropped', 'rewatching']);
export type WatchStatus = z.infer<typeof WatchStatusSchema>;

export const MoodTagSchema = z.enum([
  'cozy',
  'intense',
  'background',
  'binge-worthy',
  'thought-provoking',
  'laugh-out-loud',
  'tearjerker',
  'edge-of-seat',
  'slow-burn',
  'comfort-rewatch',
]);
export type MoodTag = z.infer<typeof MoodTagSchema>;

export const WatchEntrySourceSchema = z.enum([
  'manual',
  'screenshot_sync',
  'share_link',
  'onboarding',
  'data_import',
]);
export type WatchEntrySource = z.infer<typeof WatchEntrySourceSchema>;

export const WatchEntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  content_id: z.string().uuid(),
  status: WatchStatusSchema,
  rating: z.number().min(1).max(10).nullable(),
  take: z.string().max(500).nullable(),
  mood_tags: z.array(MoodTagSchema).default([]),
  privacy_level: PrivacyLevelSchema,
  hide_from_feed: z.boolean().default(false),
  rewatch_count: z.number().default(0),
  watched_on: z.string().date().nullable(),
  platform: PlatformSchema.nullable(),
  source: WatchEntrySourceSchema.default('manual'),
  match_confidence: z.number().min(0).max(1).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  // Joined fields
  content: ContentSchema.optional(),
  user: PublicUserSchema.optional(),
});
export type WatchEntry = z.infer<typeof WatchEntrySchema>;

export const CreateWatchEntrySchema = WatchEntrySchema.pick({
  content_id: true,
  status: true,
  rating: true,
  take: true,
  mood_tags: true,
  privacy_level: true,
  hide_from_feed: true,
  watched_on: true,
  platform: true,
});
export type CreateWatchEntry = z.infer<typeof CreateWatchEntrySchema>;

export const WatchlistItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  content_id: z.string().uuid(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  suggested_by_user_id: z.string().uuid().nullable(),
  suggestion_note: z.string().max(200).nullable(),
  platform_preference: PlatformSchema.nullable(),
  created_at: z.string().datetime(),
  content: ContentSchema.optional(),
  suggested_by: PublicUserSchema.optional(),
});
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;
