/**
 * Content canonicalization service
 *
 * Resolves a raw title (e.g. from a screenshot) to either:
 *   1. An existing `content` row in our DB, or
 *   2. A fresh record fetched from TMDB / YouTube
 *
 * Flow:
 *   normalizeTitle(raw)
 *     → exact match in DB aliases?      → return existing
 *     → fuzzy match in DB (trigram)?    → return existing (if confident)
 *     → search TMDB/YouTube             → upsert + return new
 */

import { db } from '@staffpicks/db';
import { content } from '@staffpicks/db/schema';
import { normalizeTitle, fuzzyMatch } from '@staffpicks/utils';
import { eq, sql, or } from 'drizzle-orm';
import {
  searchMulti,
  getMovieWithCredits,
  getTvWithCredits,
  tmdbPosterUrl,
  tmdbBackdropUrl,
  type TmdbMovie,
  type TmdbTvShow,
} from './tmdb.js';
import { searchAndEnrich } from './youtube.js';

// Minimum fuzzy-match score (0–1) to accept a DB hit without re-fetching
const FUZZY_CONFIDENCE = 0.75;

export type ContentType = 'movie' | 'tv' | 'youtube' | 'tiktok' | 'podcast' | 'short' | 'other';

export interface CanonicalContent {
  id: string;
  title: string;
  contentType: ContentType;
  year: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  overview: string | null;
  runtimeMinutes: number | null;
  tmdbId: number | null;
  youtubeId: string | null;
  channelId: string | null;
  channelTitle: string | null;
  genres: string[];
  isNew: boolean;
}

// ─── DB look-ups ──────────────────────────────────────────────────────────────

/** Try to find an existing content row by normalized title (alias match or trigram) */
async function findInDb(normalized: string): Promise<typeof content.$inferSelect | null> {
  // 1. Check match_aliases JSONB array for an exact normalized hit
  const [aliasHit] = await db
    .select()
    .from(content)
    .where(
      sql`${content.matchAliases} @> ${JSON.stringify([normalized])}::jsonb`,
    )
    .limit(1);

  if (aliasHit) return aliasHit;

  // 2. Trigram similarity search on the title column
  const rows = await db
    .select()
    .from(content)
    .where(
      sql`similarity(${content.title}, ${normalized}) > 0.4`,
    )
    .orderBy(sql`similarity(${content.title}, ${normalized}) DESC`)
    .limit(5);

  if (rows.length === 0) return null;

  // Run our own fuzzy scorer to validate confidence
  const candidates = rows.map((r) => r.title);
  const matches = fuzzyMatch(normalized, candidates, 3);

  if (matches.length > 0 && matches[0].score >= FUZZY_CONFIDENCE) {
    return rows.find((r) => r.title === matches[0].candidate) ?? null;
  }

  return null;
}

// ─── TMDB → DB shape ─────────────────────────────────────────────────────────

async function upsertMovieFromTmdb(
  tmdbId: number,
  raw: string,
): Promise<typeof content.$inferSelect> {
  const detail = await getMovieWithCredits(tmdbId);
  const year = detail.release_date ? Number(detail.release_date.slice(0, 4)) : null;
  const normalized = normalizeTitle(detail.title);

  const aliases = Array.from(
    new Set([
      normalized,
      normalizeTitle(raw),
      normalizeTitle(detail.original_title),
    ].filter(Boolean)),
  );

  const values = {
    title: detail.title,
    contentType: 'movie' as const,
    year,
    overview: detail.overview || null,
    posterUrl: tmdbPosterUrl(detail.poster_path),
    backdropUrl: tmdbBackdropUrl(detail.backdrop_path),
    runtimeMinutes: detail.runtime ?? null,
    genres: detail.genres.map((g) => g.name),
    externalIds: { tmdb: tmdbId, imdb: detail.imdb_id ?? null },
    tmdbId,
    matchAliases: aliases,
    metadata: {
      cast: detail.cast.map((c) => c.name),
      director: detail.director?.name ?? null,
      tagline: detail.tagline || null,
      collection: detail.belongs_to_collection?.name ?? null,
    },
  };

  const [row] = await db
    .insert(content)
    .values(values)
    .onConflictDoUpdate({
      target: content.tmdbId,
      set: {
        posterUrl: values.posterUrl,
        backdropUrl: values.backdropUrl,
        runtimeMinutes: values.runtimeMinutes,
        genres: values.genres,
        metadata: values.metadata,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
}

async function upsertTvFromTmdb(
  tmdbId: number,
  raw: string,
): Promise<typeof content.$inferSelect> {
  const detail = await getTvWithCredits(tmdbId);
  const year = detail.first_air_date ? Number(detail.first_air_date.slice(0, 4)) : null;
  const normalized = normalizeTitle(detail.name);

  const aliases = Array.from(
    new Set([
      normalized,
      normalizeTitle(raw),
      normalizeTitle(detail.original_name),
    ].filter(Boolean)),
  );

  const avgRuntime =
    detail.episode_run_time.length > 0
      ? Math.round(
          detail.episode_run_time.reduce((a, b) => a + b, 0) / detail.episode_run_time.length,
        )
      : null;

  const values = {
    title: detail.name,
    contentType: 'tv' as const,
    year,
    overview: detail.overview || null,
    posterUrl: tmdbPosterUrl(detail.poster_path),
    backdropUrl: tmdbBackdropUrl(detail.backdrop_path),
    runtimeMinutes: avgRuntime,
    genres: detail.genres.map((g) => g.name),
    externalIds: { tmdb: tmdbId },
    tmdbId,
    matchAliases: aliases,
    metadata: {
      cast: detail.cast.map((c) => c.name),
      numberOfSeasons: detail.number_of_seasons,
      numberOfEpisodes: detail.number_of_episodes,
      networks: detail.networks.map((n) => n.name),
      status: detail.status,
      tagline: detail.tagline || null,
    },
  };

  const [row] = await db
    .insert(content)
    .values(values)
    .onConflictDoUpdate({
      target: content.tmdbId,
      set: {
        posterUrl: values.posterUrl,
        backdropUrl: values.backdropUrl,
        genres: values.genres,
        metadata: values.metadata,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
}

// ─── YouTube → DB shape ───────────────────────────────────────────────────────

async function upsertYoutubeContent(
  videoId: string,
  raw: string,
  enriched: Awaited<ReturnType<typeof searchAndEnrich>>[number],
): Promise<typeof content.$inferSelect> {
  const normalized = normalizeTitle(enriched.title);
  const year = enriched.publishedAt ? Number(enriched.publishedAt.slice(0, 4)) : null;

  const isShort = enriched.durationSeconds > 0 && enriched.durationSeconds <= 60;

  const values = {
    title: enriched.title,
    contentType: (isShort ? 'short' : 'youtube') as ContentType,
    year,
    overview: enriched.description ? enriched.description.slice(0, 500) : null,
    posterUrl: enriched.thumbnailUrl,
    runtimeMinutes: enriched.durationSeconds > 0
      ? Math.round(enriched.durationSeconds / 60)
      : null,
    genres: [] as string[],
    externalIds: { youtube: videoId, channel: enriched.channelId },
    youtubeVideoId: videoId,
    channelId: enriched.channelId,
    channelTitle: enriched.channelTitle,
    matchAliases: Array.from(new Set([normalized, normalizeTitle(raw)].filter(Boolean))),
    metadata: {
      tags: enriched.tags.slice(0, 20),
      viewCount: enriched.viewCount,
    },
  };

  const [row] = await db
    .insert(content)
    .values(values)
    .onConflictDoUpdate({
      target: content.youtubeVideoId,
      set: {
        posterUrl: values.posterUrl,
        metadata: values.metadata,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
}

// ─── Row → canonical shape ────────────────────────────────────────────────────

function toCanonical(
  row: typeof content.$inferSelect,
  isNew: boolean,
): CanonicalContent {
  return {
    id: row.id,
    title: row.title,
    contentType: row.contentType as ContentType,
    year: row.year ?? null,
    posterUrl: row.posterUrl ?? null,
    backdropUrl: row.backdropUrl ?? null,
    overview: row.overview ?? null,
    runtimeMinutes: row.runtimeMinutes ?? null,
    tmdbId: row.tmdbId ?? null,
    youtubeId: (row.externalIds as Record<string, unknown>)?.youtube as string ?? null,
    channelId: row.channelId ?? null,
    channelTitle: row.channelTitle ?? null,
    genres: (row.genres as string[]) ?? [],
    isNew,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SearchContentResult {
  source: 'db' | 'tmdb' | 'youtube';
  items: Array<{
    tmdbId?: number;
    youtubeId?: string;
    title: string;
    contentType: ContentType;
    year: number | null;
    posterUrl: string | null;
    overview: string | null;
    runtimeMinutes?: number | null;
    genres: string[];
    channelTitle?: string | null;
  }>;
}

/**
 * Search for content by title — used by the "add to shelf" search.
 * Returns raw candidates (not yet persisted) for the user to choose from.
 */
export async function searchContent(
  query: string,
  type?: 'movie' | 'tv' | 'youtube' | 'all',
): Promise<SearchContentResult> {
  const effectiveType = type ?? 'all';

  if (effectiveType === 'youtube') {
    const results = await searchAndEnrich(query, 8);
    return {
      source: 'youtube',
      items: results.map((v) => ({
        youtubeId: v.videoId,
        title: v.title,
        contentType: v.durationSeconds <= 60 ? 'short' : 'youtube',
        year: v.publishedAt ? Number(v.publishedAt.slice(0, 4)) : null,
        posterUrl: v.thumbnailUrl,
        overview: v.description.slice(0, 200) || null,
        runtimeMinutes: Math.round(v.durationSeconds / 60),
        genres: [],
        channelTitle: v.channelTitle,
      })),
    };
  }

  // Default: TMDB multi-search (movies + TV)
  const results = await searchMulti(query);

  const items = results.results
    .filter((r): r is TmdbMovie | TmdbTvShow => {
      const mt = (r as TmdbMovie).media_type ?? (r as TmdbTvShow).media_type;
      if (effectiveType === 'movie') return mt === 'movie';
      if (effectiveType === 'tv') return mt === 'tv';
      return mt === 'movie' || mt === 'tv';
    })
    .slice(0, 10)
    .map((r) => {
      const isMovie = 'title' in r;
      const title = isMovie ? r.title : (r as TmdbTvShow).name;
      const date = isMovie ? r.release_date : (r as TmdbTvShow).first_air_date;
      return {
        tmdbId: r.id,
        title,
        contentType: (isMovie ? 'movie' : 'tv') as ContentType,
        year: date ? Number(date.slice(0, 4)) : null,
        posterUrl: tmdbPosterUrl(r.poster_path),
        overview: r.overview || null,
        genres: [] as string[], // genre names need a separate /genres call; IDs only here
      };
    });

  return { source: 'tmdb', items };
}

/**
 * Resolve a raw title to a canonical DB record, creating one if needed.
 * Used by the screenshot sync pipeline.
 */
export async function resolveContent(
  rawTitle: string,
  hint?: { type?: ContentType; tmdbId?: number; youtubeId?: string },
): Promise<CanonicalContent | null> {
  const normalized = normalizeTitle(rawTitle);

  // 1. Direct ID match — trust the caller
  if (hint?.tmdbId) {
    const [existing] = await db
      .select()
      .from(content)
      .where(eq(content.tmdbId, hint.tmdbId))
      .limit(1);

    if (existing) return toCanonical(existing, false);
    // Not in DB yet — fetch and persist
    const row = hint.type === 'tv'
      ? await upsertTvFromTmdb(hint.tmdbId, rawTitle)
      : await upsertMovieFromTmdb(hint.tmdbId, rawTitle);
    return toCanonical(row, true);
  }

  if (hint?.youtubeId) {
    const [existing] = await db
      .select()
      .from(content)
      .where(sql`${content.externalIds}->>'youtube' = ${hint.youtubeId}`)
      .limit(1);

    if (existing) return toCanonical(existing, false);
    // Fetch from YT and persist
    const enriched = await searchAndEnrich(rawTitle, 1);
    if (enriched.length === 0) return null;
    const row = await upsertYoutubeContent(hint.youtubeId, rawTitle, enriched[0]);
    return toCanonical(row, true);
  }

  // 2. Try DB first
  const dbHit = await findInDb(normalized);
  if (dbHit) return toCanonical(dbHit, false);

  // 3. Search external APIs
  if (hint?.type === 'youtube') {
    const results = await searchAndEnrich(rawTitle, 3);
    if (results.length === 0) return null;
    const best = results[0];
    const row = await upsertYoutubeContent(best.videoId, rawTitle, best);
    return toCanonical(row, true);
  }

  // Default: TMDB
  const tmdbResults = await searchMulti(rawTitle);
  const top = tmdbResults.results.find(
    (r) => (r as TmdbMovie).media_type === 'movie' || (r as TmdbTvShow).media_type === 'tv',
  );

  if (!top) return null;

  const isMovie = 'title' in top;
  const row = isMovie
    ? await upsertMovieFromTmdb(top.id, rawTitle)
    : await upsertTvFromTmdb(top.id, rawTitle);

  return toCanonical(row, true);
}
