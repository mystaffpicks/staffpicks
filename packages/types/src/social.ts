import { z } from 'zod';
import { WatchEntrySchema } from './watch.js';
import { PublicUserSchema } from './user.js';

export const FollowStatusSchema = z.enum(['following', 'pending', 'blocked']);
export type FollowStatus = z.infer<typeof FollowStatusSchema>;

export const FollowSchema = z.object({
  follower_id: z.string().uuid(),
  following_id: z.string().uuid(),
  status: FollowStatusSchema,
  created_at: z.string().datetime(),
});
export type Follow = z.infer<typeof FollowSchema>;

export const FeedItemTypeSchema = z.enum([
  'watch_entry',
  'watch_entry_batch',
  'watchlist_add',
  'clip_share',
]);
export type FeedItemType = z.infer<typeof FeedItemTypeSchema>;

export const FeedItemSchema = z.object({
  id: z.string(),
  type: FeedItemTypeSchema,
  user: PublicUserSchema,
  watch_entries: z.array(WatchEntrySchema),
  timestamp: z.string().datetime(),
  // Whether the current user has also watched this content
  viewer_also_watched: z.boolean().optional(),
});
export type FeedItem = z.infer<typeof FeedItemSchema>;

export const InteractionTypeSchema = z.enum(['like', 'comment', 'fire', 'rewatch_prompt']);
export type InteractionType = z.infer<typeof InteractionTypeSchema>;
