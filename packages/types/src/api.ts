import { z } from 'zod';

// Generic paginated response wrapper
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    next_cursor: z.string().nullable(),
    has_more: z.boolean(),
    total: z.number().optional(),
  });

export type PaginatedResponse<T> = {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
  total?: number;
};

// Generic API error
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  status_code: z.number(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// Screenshot sync types
export const ExtractedItemSchema = z.object({
  title: z.string(),
  platform: z.string().optional(),
  inferred_status: z.enum(['watching', 'watched', 'unknown']),
  confidence: z.number().min(0).max(1),
  metadata: z.object({
    season: z.number().nullable().optional(),
    episode: z.number().nullable().optional(),
    episode_title: z.string().nullable().optional(),
    progress_percent: z.number().nullable().optional(),
    channel_name: z.string().nullable().optional(),
    timestamp: z.string().nullable().optional(),
  }),
  // After canonical matching
  content_id: z.string().uuid().optional(),
  match_confidence: z.number().optional(),
});
export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;

export const ScreenshotSyncSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  image_url: z.string().url(),
  detected_platform: z.string().nullable(),
  extracted_items: z.array(ExtractedItemSchema),
  confirmed_items: z.array(ExtractedItemSchema),
  processing_status: z.enum(['pending', 'processing', 'review', 'confirmed', 'failed']),
  processed_at: z.string().datetime().nullable(),
  confirmed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type ScreenshotSync = z.infer<typeof ScreenshotSyncSchema>;
