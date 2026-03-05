import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '@staffpicks/db';
import { content, watchEntries } from '@staffpicks/db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { searchContent, resolveContent } from '../lib/content-canon.js';
import { getMovieWithCredits, getTvWithCredits } from '../lib/tmdb.js';
import { getVideoDetail, parseDuration, bestThumbnail } from '../lib/youtube.js';

// ─── Validation schemas ────────────────────────────────────────────────────────

const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['movie', 'tv', 'youtube', 'all']).optional().default('all'),
  page: z.coerce.number().int().min(1).max(50).optional().default(1),
});

const ResolveBodySchema = z.object({
  rawTitle: z.string().min(1).max(300),
  hint: z
    .object({
      type: z.enum(['movie', 'tv', 'youtube', 'tiktok', 'podcast', 'short', 'other']).optional(),
      tmdbId: z.number().int().positive().optional(),
      youtubeId: z.string().optional(),
    })
    .optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function contentRoutes(app: FastifyInstance) {
  /**
   * GET /api/content/search?q=&type=
   * Live search — hits TMDB/YouTube; no auth required.
   */
  app.get('/content/search', { preHandler: [optionalAuth] }, async (request, reply) => {
    const parseResult = SearchQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.code(400).send({ error: 'Bad request', issues: parseResult.error.issues });
    }

    const { q, type } = parseResult.data;

    try {
      const results = await searchContent(q, type === 'all' ? undefined : type);
      return reply.send(results);
    } catch (err) {
      request.log.error({ err }, 'Content search failed');
      return reply.code(502).send({ error: 'External API error', message: String(err) });
    }
  });

  /**
   * POST /api/content/resolve
   * Resolve a raw title to a canonical DB record (creates if missing).
   * Used internally by the sync pipeline — requires auth.
   */
  app.post(
    '/content/resolve',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parseResult = ResolveBodySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.code(400).send({ error: 'Bad request', issues: parseResult.error.issues });
      }

      const { rawTitle, hint } = parseResult.data;

      try {
        const canonical = await resolveContent(rawTitle, hint);
        if (!canonical) {
          return reply.code(404).send({ error: 'Could not resolve content', rawTitle });
        }
        return reply.send(canonical);
      } catch (err) {
        request.log.error({ err }, 'Content resolve failed');
        return reply.code(502).send({ error: 'External API error', message: String(err) });
      }
    },
  );

  /**
   * GET /api/content/:id
   * Get a single content record from our DB.
   * If includeWatchCount=true, joins with watch_entries for popularity.
   */
  app.get('/content/:id', { preHandler: [optionalAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { enrich } = request.query as { enrich?: string };

    const [row] = await db
      .select()
      .from(content)
      .where(eq(content.id, id))
      .limit(1);

    if (!row) {
      return reply.code(404).send({ error: 'Content not found' });
    }

    // Optionally re-fetch enriched data from TMDB/YouTube
    if (enrich === 'true' && row.tmdbId) {
      try {
        const isMovie = row.contentType === 'movie';
        const fresh = isMovie
          ? await getMovieWithCredits(row.tmdbId)
          : await getTvWithCredits(row.tmdbId);
        return reply.send({ content: row, enriched: fresh });
      } catch {
        // Fall through — return basic DB row
      }
    }

    if (enrich === 'true' && row.youtubeVideoId) {
      try {
        const ytDetail = await getVideoDetail(row.youtubeVideoId);
        if (ytDetail) {
          return reply.send({
            content: row,
            enriched: {
              videoId: row.youtubeVideoId,
              title: ytDetail.snippet.title,
              channelTitle: ytDetail.snippet.channelTitle,
              thumbnailUrl: bestThumbnail(ytDetail.snippet.thumbnails),
              durationSeconds: parseDuration(ytDetail.contentDetails.duration),
              viewCount: Number(ytDetail.statistics.viewCount),
              tags: ytDetail.snippet.tags ?? [],
            },
          });
        }
      } catch {
        // Fall through
      }
    }

    return reply.send({ content: row });
  });

  /**
   * GET /api/content/:id/watchers
   * How many users have logged this piece of content — for social proof.
   * Auth optional (shows friend count if authenticated).
   */
  app.get(
    '/content/:id/watchers',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const [result] = await db
        .select({ count: sql<number>`count(distinct ${watchEntries.userId})` })
        .from(watchEntries)
        .where(eq(watchEntries.contentId, id));

      return reply.send({ contentId: id, watcherCount: Number(result?.count ?? 0) });
    },
  );

  /**
   * GET /api/content/trending
   * Top 20 most-logged content in the last 30 days.
   */
  app.get('/content/trending', { preHandler: [optionalAuth] }, async (request, reply) => {
    const { type } = request.query as { type?: string };

    const rows = await db
      .select({
        content: content,
        watchCount: sql<number>`count(${watchEntries.id})`,
      })
      .from(watchEntries)
      .innerJoin(content, eq(content.id, watchEntries.contentId))
      .where(
        and(
          sql`${watchEntries.createdAt} > now() - interval '30 days'`,
          type ? eq(content.contentType, type) : sql`true`,
        ),
      )
      .groupBy(content.id)
      .orderBy(desc(sql`count(${watchEntries.id})`))
      .limit(20);

    return reply.send({
      items: rows.map((r) => ({ ...r.content, watchCount: Number(r.watchCount) })),
    });
  });
}
