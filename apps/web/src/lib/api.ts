/**
 * Typed API client for the StaffPicks Fastify backend.
 * Used by both server components (with a token) and client components (useApiClient hook).
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://api.mystaffpicks.com'
    : 'http://localhost:3001');

export interface WatchEntry {
  id: string;
  status: 'watched' | 'watching' | 'dropped' | 'rewatching';
  rating: number | null;
  take: string | null;
  mood_tags: string[];
  privacy_level: string;
  watched_on: string | null;
  platform: string | null;
  rewatch_count: number;
  hide_from_feed: boolean;
  source: string;
  created_at: string;
  updated_at: string;
  // Joined content fields
  content_id: string;
  content_type: 'movie' | 'tv' | 'youtube' | 'tiktok' | 'podcast' | 'short' | 'other';
  content_title: string;
  content_description: string | null;
  content_thumbnail_url: string | null;
  content_poster_url: string | null;
  content_metadata: {
    year?: number;
    runtime_minutes?: number;
    season_count?: number;
    episode_count?: number;
    genres?: string[];
    channel_name?: string;
  } | null;
  content_external_ids: Record<string, unknown> | null;
}

export interface WatchlistItem {
  id: string;
  priority: string;
  suggestion_note: string | null;
  platform_preference: string | null;
  created_at: string;
  content_id: string;
  content_type: string;
  content_title: string;
  content_thumbnail_url: string | null;
  content_poster_url: string | null;
  content_metadata: Record<string, unknown> | null;
}

export interface ContentResult {
  id: string;
  content_type: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  poster_url?: string;
  metadata?: Record<string, unknown>;
  external_ids?: Record<string, unknown>;
  // From search (may be enriched)
  source?: 'db' | 'tmdb' | 'youtube';
}

export interface PaginatedEntries {
  entries: WatchEntry[];
  pagination: { total: number; limit: number; offset: number };
}

// ─── Server-side helper (pass the Clerk token) ───────────────────────────────

export async function apiFetch<T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ─── Typed endpoint helpers ──────────────────────────────────────────────────

export const api = {
  watchEntries: {
    list: (token: string, params?: { status?: string; content_type?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status)       qs.set('status', params.status);
      if (params?.content_type) qs.set('content_type', params.content_type);
      if (params?.limit)        qs.set('limit', String(params.limit));
      if (params?.offset)       qs.set('offset', String(params.offset));
      const q = qs.toString();
      return apiFetch<PaginatedEntries>(`/api/watch-entries${q ? `?${q}` : ''}`, token);
    },
    create: (token: string, body: {
      content_id: string;
      status: 'watched' | 'watching' | 'dropped' | 'rewatching';
      rating?: number;
      take?: string;
      mood_tags?: string[];
      watched_on?: string;
      platform?: string;
      privacy_level?: string;
    }) => apiFetch<{ entry: WatchEntry }>('/api/watch-entries', token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    update: (token: string, id: string, body: Partial<WatchEntry>) =>
      apiFetch<{ entry: WatchEntry }>(`/api/watch-entries/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (token: string, id: string) =>
      apiFetch<void>(`/api/watch-entries/${id}`, token, { method: 'DELETE' }),
  },
  watchlist: {
    list: (token: string) => apiFetch<{ items: WatchlistItem[] }>('/api/watchlist', token),
    add: (token: string, content_id: string, priority?: string) =>
      apiFetch<{ item: WatchlistItem }>('/api/watchlist', token, {
        method: 'POST',
        body: JSON.stringify({ content_id, priority: priority ?? 'medium' }),
      }),
    remove: (token: string, contentId: string) =>
      apiFetch<void>(`/api/watchlist/${contentId}`, token, { method: 'DELETE' }),
  },
  content: {
    search: (token: string, query: string, type?: string) => {
      const qs = new URLSearchParams({ q: query });
      if (type) qs.set('type', type);
      return apiFetch<{ results: ContentResult[] }>(`/api/content/search?${qs}`, token);
    },
  },
};
