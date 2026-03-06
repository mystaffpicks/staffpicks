/**
 * Typed API client for the StaffPicks mobile app.
 * Mirrors apps/web/src/lib/api.ts — keep in sync.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchEntry {
  id: string;
  status: 'watched' | 'watching' | 'dropped' | 'rewatching';
  rating: number | null;
  take: string | null;
  mood_tags: string[];
  privacy_level: 'public' | 'friends' | 'private';
  watched_on: string | null;
  platform: string | null;
  rewatch_count: number;
  hide_from_feed: boolean;
  source: string;
  created_at: string;
  updated_at: string;
  // Joined content fields
  content_id: string;
  content_type: string;
  content_title: string;
  content_description: string | null;
  content_thumbnail_url: string | null;
  content_poster_url: string | null;
  content_metadata: Record<string, unknown> | null;
  content_external_ids: Record<string, unknown> | null;
}

export interface WatchlistItem {
  id: string;
  priority: 'high' | 'medium' | 'low';
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
  source: string;
  content_type: string;
  title: string;
  thumbnail_url?: string;
  poster_url?: string;
  metadata?: Record<string, unknown>;
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── API object ───────────────────────────────────────────────────────────────

export const api = {
  watchEntries: {
    list: (token: string, params: { status?: string; limit?: number; offset?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.status)  q.set('status',  params.status);
      if (params.limit)   q.set('limit',   String(params.limit));
      if (params.offset)  q.set('offset',  String(params.offset));
      const qs = q.toString();
      return apiFetch<{ entries: WatchEntry[]; pagination: { total: number; limit: number; offset: number } }>(
        token, `/watch-entries${qs ? `?${qs}` : ''}`,
      );
    },

    create: (token: string, body: {
      content_id: string;
      status: WatchEntry['status'];
      rating?: number;
      take?: string;
      mood_tags?: string[];
      watched_on?: string;
      privacy_level?: WatchEntry['privacy_level'];
    }) => apiFetch<{ entry: WatchEntry }>(token, '/watch-entries', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

    update: (token: string, id: string, body: Partial<Pick<WatchEntry,
      'status' | 'rating' | 'take' | 'mood_tags' | 'watched_on' | 'privacy_level'
    >>) => apiFetch<{ entry: WatchEntry }>(token, `/watch-entries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

    delete: (token: string, id: string) =>
      apiFetch<void>(token, `/watch-entries/${id}`, { method: 'DELETE' }),
  },

  watchlist: {
    list: (token: string) =>
      apiFetch<{ items: WatchlistItem[] }>(token, '/watchlist'),

    add: (token: string, body: { content_id: string; priority?: WatchlistItem['priority'] }) =>
      apiFetch<{ item: WatchlistItem | null }>(token, '/watchlist', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    remove: (token: string, contentId: string) =>
      apiFetch<void>(token, `/watchlist/${contentId}`, { method: 'DELETE' }),
  },

  content: {
    search: (token: string, q: string) =>
      apiFetch<{ results: ContentResult[] }>(token, `/content/search?q=${encodeURIComponent(q)}`),
  },
};
