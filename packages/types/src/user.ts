import { z } from 'zod';
import { ContentTypeSchema, PlatformSchema } from './content.js';

export const PrivacyLevelSchema = z.enum(['public', 'friends', 'private']);
export type PrivacyLevel = z.infer<typeof PrivacyLevelSchema>;

export const ContentTypePrivacyDefaultsSchema = z.record(ContentTypeSchema, PrivacyLevelSchema);
export type ContentTypePrivacyDefaults = z.infer<typeof ContentTypePrivacyDefaultsSchema>;

export const TasteProfileSchema = z.object({
  mood_preferences: z.array(z.string()).optional(),
  genre_weights: z.record(z.string(), z.number()).optional(),
  platform_preferences: z.array(PlatformSchema).optional(),
  anchor_cluster_scores: z.record(z.string(), z.number()).optional(),
});
export type TasteProfile = z.infer<typeof TasteProfileSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  clerk_id: z.string(),
  username: z.string().min(3).max(30),
  display_name: z.string().max(60),
  avatar_url: z.string().url().nullable(),
  bio: z.string().max(300).nullable(),
  email: z.string().email(),
  default_privacy_level: PrivacyLevelSchema.default('friends'),
  content_type_privacy_defaults: ContentTypePrivacyDefaultsSchema.optional(),
  enabled_platforms: z.array(PlatformSchema).default([]),
  taste_profile: TasteProfileSchema.optional(),
  sync_reminder_time: z.string().regex(/^\d{2}:\d{2}$/).default('21:00'),
  onboarding_completed: z.boolean().default(false),
  push_token: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const PublicUserSchema = UserSchema.pick({
  id: true,
  username: true,
  display_name: true,
  avatar_url: true,
  bio: true,
}).extend({
  watch_count: z.number().optional(),
  follower_count: z.number().optional(),
  following_count: z.number().optional(),
  taste_match_score: z.number().min(0).max(100).optional(),
});
export type PublicUser = z.infer<typeof PublicUserSchema>;
