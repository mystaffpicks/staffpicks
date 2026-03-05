/**
 * TMDB (The Movie Database) API client
 * Docs: https://developer.themoviedb.org/reference/intro/getting-started
 */

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

function getKey(): string {
  if (!process.env.TMDB_API_KEY) throw new Error('TMDB_API_KEY is not set');
  return process.env.TMDB_API_KEY;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', getKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  media_type?: 'movie';
}

export interface TmdbTvShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  media_type?: 'tv';
}

export interface TmdbMovieDetail extends TmdbMovie {
  runtime: number | null;
  genres: Array<{ id: number; name: string }>;
  status: string;
  tagline: string;
  imdb_id: string | null;
  production_companies: Array<{ id: number; name: string; logo_path: string | null }>;
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string | null;
  } | null;
}

export interface TmdbTvDetail extends TmdbTvShow {
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  genres: Array<{ id: number; name: string }>;
  status: string;
  tagline: string;
  networks: Array<{ id: number; name: string; logo_path: string | null }>;
  created_by: Array<{ id: number; name: string }>;
  seasons: Array<{
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    air_date: string;
    poster_path: string | null;
  }>;
}

export interface TmdbSearchResult {
  page: number;
  results: Array<TmdbMovie | TmdbTvShow>;
  total_pages: number;
  total_results: number;
}

export interface TmdbCredits {
  cast: Array<{
    id: number;
    name: string;
    character: string;
    order: number;
    profile_path: string | null;
  }>;
  crew: Array<{
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
  }>;
}

// ─── Image helpers ─────────────────────────────────────────────────────────

export function tmdbPosterUrl(
  path: string | null,
  size: 'w92' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500',
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function tmdbBackdropUrl(
  path: string | null,
  size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280',
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// ─── Search ────────────────────────────────────────────────────────────────

/** Search movies + TV shows in a single call (multi-search) */
export async function searchMulti(
  query: string,
  page = 1,
): Promise<TmdbSearchResult> {
  return tmdbFetch<TmdbSearchResult>('/search/multi', {
    query,
    page: String(page),
    include_adult: 'false',
  });
}

/** Search movies only */
export async function searchMovies(query: string, page = 1): Promise<TmdbSearchResult> {
  return tmdbFetch<TmdbSearchResult>('/search/movie', {
    query,
    page: String(page),
    include_adult: 'false',
  });
}

/** Search TV shows only */
export async function searchTv(query: string, page = 1): Promise<TmdbSearchResult> {
  return tmdbFetch<TmdbSearchResult>('/search/tv', {
    query,
    page: String(page),
  });
}

// ─── Detail ────────────────────────────────────────────────────────────────

export async function getMovieDetail(tmdbId: number): Promise<TmdbMovieDetail> {
  return tmdbFetch<TmdbMovieDetail>(`/movie/${tmdbId}`);
}

export async function getTvDetail(tmdbId: number): Promise<TmdbTvDetail> {
  return tmdbFetch<TmdbTvDetail>(`/tv/${tmdbId}`);
}

export async function getMovieCredits(tmdbId: number): Promise<TmdbCredits> {
  return tmdbFetch<TmdbCredits>(`/movie/${tmdbId}/credits`);
}

export async function getTvCredits(tmdbId: number): Promise<TmdbCredits> {
  return tmdbFetch<TmdbCredits>(`/tv/${tmdbId}/credits`);
}

/** Fetch full detail + top cast in parallel */
export async function getMovieWithCredits(tmdbId: number) {
  const [detail, credits] = await Promise.all([
    getMovieDetail(tmdbId),
    getMovieCredits(tmdbId),
  ]);
  return {
    ...detail,
    cast: credits.cast.slice(0, 10),
    director: credits.crew.find((c) => c.job === 'Director') ?? null,
  };
}

export async function getTvWithCredits(tmdbId: number) {
  const [detail, credits] = await Promise.all([
    getTvDetail(tmdbId),
    getTvCredits(tmdbId),
  ]);
  return {
    ...detail,
    cast: credits.cast.slice(0, 10),
  };
}
