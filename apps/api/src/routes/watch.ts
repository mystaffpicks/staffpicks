/**
 * Watch Routes — /api/watch-entries and /api/watchlist
 *
 * Handles logging, updating, deleting watch entries and managing the watchlist.
 */
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { db } from '@staffpicks/db';
import { users, watchEntries, watchlistItems, content } from '@staffpicks/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// ─── Watch Entries ────────────────────────────────────────────────────────────

export async function watchRoutes(app: FastifyInstance) {
  /**
   * GET /api/watch-entries
   * Returns the authenticated user's watch history, newest first.
   * Optionally filter by ?status=watched|watching|dropped|rewatching
   * Optionally filter by ?content_type=movie|tv|youtube|...
   * Paginate with ?limit=20&offset=0
   */
  app.get('/watch-entries', { preHandler: [requireAuth] }, async (request, reply) => {
    const clerkUserId = request.clerkUserId;
    const query = request.query as {
      status?: string;
      content_type?: string;
      limit?: string;
      offset?: string;
    };

    const limit  = Math.min(Number(query.limit)  || 20, 100);
    const offset = Number(query.offset) || 0;

    // Look up internal user
    const [user] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) return reply.code(404).send({ error: 'User not found' });

    // Build query with optional filters
    const conditions = [eq(watchEntries.user_id, user.id)];
    if (query.status) {
      conditions.push(eq(watchEntries.status, query.status as any));
    }

    const entries = await db
      .select({
        id: watchEntries.id,
        status: watchEntries.status,
        rating: watchEntries.rating,
        take: watchEntries.take,
        mood_tags: watchEntries.mood_tags,
        privacy_level: watchEntries.privacy_level,
        watched_on: watchEntries.watched_on,
        platform: watchEntries.platform,
        rewatch_count: watchEntries.rewatch_count,
        hide_from_feed: watchEntries.hide_from_feed,
        source: watchEntries.source,
        created_at: watchEntries.created_at,
        updated_at: watchEntries.updated_at,
        // Content fields joined
        content_id: content.id,
        content_type: content.content_type,
        content_title: content.title,
        content_description: content.description,
        content_thumbnail_url: content.thumbnail_url,
        content_poster_url: content.poster_url,
        content_metadata: content.metadata,
        content_external_ids: content.external_ids,
      })
      .from(watchEntries)
      .innerJoin(content, eq(watchEntries.content_id, content.id))
      .where(and(...conditions))
      .orderBy(desc(watchEntries.created_at))
      .limit(limit)
      .offset(offset);

    // Filter by content_type after join if requested
    const filtered = query.content_type
      ? entries.filter((e) => e.content_type === query.content_type)
      : entries;

    // Count total for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(watchEntries)
      .where(and(...conditions));

    return reply.send({
      entries: filtered,
      pagination: { total: count, limit, offset },
    });
  });

  /**
   * POST /api/watch-entries
   * Log a new watch entry.
   *
   * Body: { content_id, status, rating?, take?, mood_tags?, watched_on?,
   *         platform?, privacy_level?, hide_from_feed? }
   */
  app.post('/watch-entries', { preHandler: [requireAuth] }, async (request, reply) => {
    const clerkUserId = request.clerkUserId;
    const body = request.body as {
      content_id: string;
      status: 'watched' | 'watching' | 'dropped' | 'rewatching';
      rating?: number;
      take?: string;
      mood_tags?: string[];
      watched_on?: string;
      platform?: string;
      privacy_level?: 'public' | 'friends' | 'private';
      hide_from_feed?: boolean;
    };

    if (!body.content_id || !body.status) {
      return reply.code(400).send({ error: 'content_id and status are required' });
    }
    if (body.rating !== undefined && (body.rating < 1 || body.rating > 10)) {
      return reply.code(400).send({ error: 'rating must be between 1 and 10' });
    }

    const [user] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) return reply.code(404).send({ error: 'User not found' });

    // Verify content exists
    const [existingContent] = await db.select({ id: content.id })
      .from(content)
      .where(eq(content.id, body.content_id))
      .limit(1);

    if (!existingContent) return reply.code(404).send({ error: 'Content not found' });

    const [entry] = await db.insert(watchEntries).values({
      user_id: user.id,
      content_id: body.content_id,
      status: body.status,
      rating: body.rating ?? null,
      take: body.take ?? null,
      mood_tags: body.mood_tags ?? [],
      watched_on: body.watched_on ?? null,
      platform: body.platform ?? null,
      privacy_level: body.privacy_level ?? 'friends',
      hide_from_feed: body.hide_from_feed ?? false,
      source: 'manual',
    }).returning();

    // If marking as watched, also remove from watchlist if present
    if (body.status === 'watched') {
      await db.delete(watchlistItems)
        .where(and(
          eq(watchlistItems.user_id, user.id),
          eq(watchlistItems.content_id, body.content_id),
        ));
    }

    return reply.code(201).send({ entry });
  });

  /**
   * PATCH /api/watch-entries/:id
   * Update an existing watch entry (rating, take, status, privacy, etc.)
   */
  app.patch('/watch-entries/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const clerkUserId = request.clerkUserId;
    const { id } = request.params as { id: string };
    const body = request.body as {
      status?: 'watched' | 'watching' | 'dropped' | 'rewatching';
      rating?: number | null;
      take?: string | null;
      mood_tags?: string[];
      watched_on?: string | null;
      platform?: string | null;
      privacy_level?: 'public' | 'friends' | 'private';
      hide_from_feed?: boolean;
    };

    const [user] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) return reply.code(404).send({ error: 'User not found' });

    // Check ownership
    const [existing] = await db.select({ id: watchEntries.id, user_id: watchEntries.user_id })
      .from(watchEntries)
      .where(eq(watchEntries.id, id))
      .limit(1);

    if (!existing) return reply.code(404).send({ error: 'Entry not found' });
    if (existing.user_id !== user.id) return reply.code(403).send({ error: 'Forbidden' });

    const [updated] = await db.update(watchEntries)
      .set({
        ...(body.status     !== undefined && { status: body.status }),
        ...(body.rating     !== undefined && { rating: body.rating }),
        ...(body.take       !== undefined && { take: body.take }),
        ...(body.mood_tags  !== undefined && { mood_tags: body.mood_tags }),
        ...(body.watched_on !== undefined && { watched_on: body.watched_on }),
        ...(body.platform   !== undefined && { platform: body.platform }),
        ...(body.privacy_level   !== undefined && { privacy_level: body.privacy_level }),
        ...(body.hide_from_feed  !== undefined && { hide_from_feed: body.hide_from_feed }),
        updated_at: new Date(),
      })
      .where(eq(watchEntries.id, id))
      .returning();

    return reply.send({ entry: updated });
  });

  /**
   * DELETE /api/watch-entries/:id
   * Delete a watch entry.
   */
  app.delete('/watch-entries/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const clerkUserId = request.clerkUserId;
    const { id } = request.params as { id: string };

    const [user] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) return reply.code(404).send({ error: 'User not found' });

    const [existing] = await db.select({ id: watchEntries.id, user_id: watchEntries.user_id })
      .from(watchEntries)
      .where(eq(watchEntries.id, id))
      .limit(1);

    if (!existing) return reply.code(404).send({ error: 'Entry not found' });
    if (existing.user_id !== user.id) return reply.code(403).send({ error: 'Forbidden' });

    await db.delete(watchEntries).where(eq(watchEntries.id, id));

    return reply.code(204).send();
  });

  // ─── Watchlist ──────────────────────────────────────────────────────────────

  /**
   * GET /api/watchlist
   * Returns the user's want-to-watch list, oldest first.
   */
  app.get('/watchlist', { preHandler: [requireAuth] }, async (request, reply) => {
    const clerkUserId = request.clerkUserId;

    const [user] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) return reply.code(404).send({ error: 'User not found' });

    const items = await db
      .select({
        id: watchlistItems.id,
        priority: watchlistItems.priority,
        suggestion_note: watchlistItems.suggestion_note,
        platform_preference: watchlistItems.platform_preference,
        created_at: watchlistItems.created_at,
        content_id: content.id,
        content_type: content.content_type,
        content_title: content.title,
        content_thumbnail_url: content.thumbnail_url,
        content_poster_url: content.poster_url,
        content_metadata: content.metadata,
      })
      .from(watchlistItems)
      .innerJoin(content, eq(watchlistItems.content_id, content.id))
      .where(eq(watchlistItems.user_id, user.id))
      .orderBy(desc(watchlistItems.created_at));

    return reply.send({ items });
  });

  /**
   * POST /api/watchlist
   * Add content to the watchlist.
   */
  app.post('/watchlist', { preHandler: [requireAuth] }, async (request, reply) => {
    const clerkUserId = request.clerkUserId;
    const body = request.body as {
      content_id: string;
      priority?: 'high' | 'medium' | 'low';
      suggestion_note?: string;
      platform_preference?: string;
    };

    if (!body.content_id) return reply.code(400).send({ error: 'content_id is required' });

    const [user] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) return reply.code(404).send({ error: 'User not found' });

    const [existingContent] = await db.select({ id: content.id })
      .from(content)
      .where(eq(content.id, body.content_id))
      .limit(1);

    if (!existingContent) return reply.code(404).send({ error: 'Content not found' });

    // Upsert — silently do nothing if already on list
    const [item] = await db.insert(watchlistItems)
      .values({
        user_id: user.id,
        content_id: body.content_id,
        priority: body.priority ?? 'medium',
        suggestion_note: body.suggestion_note ?? null,
        platform_preference: body.platform_preference ?? null,
      })
      .onConflictDoNothing()
      .returning();

    return reply.code(201).send({ item: item ?? null });
  });

  /**
   * DELETE /api/watchlist/:contentId
   * Remove content from the watchlist.
   */
  app.delete('/watchlist/:contentId', { preHandler: [requireAuth] }, async (request, reply) => {
    const clerkUserId = request.clerkUserId;
    const { contentId } = request.params as { contentId: string };

    const [user] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) return reply.code(404).send({ error: 'User not found' });

    await db.delete(watchlistItems)
      .where(and(
        eq(watchlistItems.user_id, user.id),
        eq(watchlistItems.content_id, contentId),
      ));

    return reply.code(204).send();
  });
}
