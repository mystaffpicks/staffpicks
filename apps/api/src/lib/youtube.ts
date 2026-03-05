/**
 * YouTube Data API v3 client
 * Docs: https://developers.google.com/youtube/v3/docs
 *
 * We use YouTube for:
 * - Searching videos/channels by title (from screenshot sync)
 * - Fetching video detail (duration, channel, description)
 * - Resolving channel names to canonical IDs
 */

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

function getKey(): string {
  if (!process.env.YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY is not set');
  return process.env.YOUTUBE_API_KEY;
}

async function ytFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${YT_BASE}${path}`);
  url.searchParams.set('key', getKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`YouTube ${path} failed: ${res.status} — ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface YtThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YtSearchItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: YtThumbnail;
      medium: YtThumbnail;
      high: YtThumbnail;
    };
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

export interface YtSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YtSearchItem[];
}

export interface YtVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: Record<string, YtThumbnail>;
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: string;
  };
  contentDetails: {
    duration: string; // ISO 8601 (e.g. "PT12M34S")
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export interface YtVideoListResponse {
  kind: string;
  etag: string;
  items: YtVideoItem[];
  pageInfo: { totalResults: number; resultsPerPage: number };
}

export interface YtChannelItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnails: Record<string, YtThumbnail>;
    country?: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse ISO 8601 duration (PT1H23M45S) to total seconds */
export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = Number(match[1] ?? 0);
  const m = Number(match[2] ?? 0);
  const s = Number(match[3] ?? 0);
  return h * 3600 + m * 60 + s;
}

/** Best available thumbnail URL */
export function bestThumbnail(
  thumbnails: Record<string, YtThumbnail>,
  preferred: 'maxresdefault' | 'high' | 'medium' | 'default' = 'high',
): string | null {
  const order = ['maxresdefault', 'standard', 'high', 'medium', 'default'];
  const start = order.indexOf(preferred);
  const ranked = [...order.slice(start), ...order.slice(0, start)];
  for (const key of ranked) {
    if (thumbnails[key]?.url) return thumbnails[key].url;
  }
  return null;
}

// ─── Search ───────────────────────────────────────────────────────────────────

/** Search YouTube videos by query. Used for screenshot sync matching. */
export async function searchVideos(
  query: string,
  maxResults = 10,
): Promise<YtSearchResponse> {
  return ytFetch<YtSearchResponse>('/search', {
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(maxResults),
    safeSearch: 'none',
    order: 'relevance',
  });
}

/** Search YouTube channels by name */
export async function searchChannels(
  query: string,
  maxResults = 5,
): Promise<YtSearchResponse> {
  return ytFetch<YtSearchResponse>('/search', {
    part: 'snippet',
    q: query,
    type: 'channel',
    maxResults: String(maxResults),
  });
}

// ─── Detail ────────────────────────────────────────────────────────────────────

/** Fetch full detail for up to 50 video IDs in a single request */
export async function getVideoDetails(videoIds: string[]): Promise<YtVideoListResponse> {
  return ytFetch<YtVideoListResponse>('/videos', {
    part: 'snippet,contentDetails,statistics',
    id: videoIds.join(','),
  });
}

export async function getVideoDetail(videoId: string): Promise<YtVideoItem | null> {
  const res = await getVideoDetails([videoId]);
  return res.items[0] ?? null;
}

/** Fetch channel details by channel ID */
export async function getChannelDetail(channelId: string): Promise<YtChannelItem | null> {
  const res = await ytFetch<{ items: YtChannelItem[] }>('/channels', {
    part: 'snippet,statistics',
    id: channelId,
  });
  return res.items[0] ?? null;
}

// ─── Composite helpers ────────────────────────────────────────────────────────

/** Search for a video and enrich top results with full detail */
export async function searchAndEnrich(query: string, limit = 5) {
  const search = await searchVideos(query, limit);
  const videoIds = search.items
    .filter((i) => i.id.videoId)
    .map((i) => i.id.videoId!);

  if (videoIds.length === 0) return [];

  const details = await getVideoDetails(videoIds);
  const detailMap = new Map(details.items.map((v) => [v.id, v]));

  return search.items
    .filter((i) => i.id.videoId && detailMap.has(i.id.videoId))
    .map((i) => {
      const detail = detailMap.get(i.id.videoId!)!;
      return {
        videoId: i.id.videoId!,
        title: detail.snippet.title,
        channelId: detail.snippet.channelId,
        channelTitle: detail.snippet.channelTitle,
        description: detail.snippet.description,
        publishedAt: detail.snippet.publishedAt,
        thumbnailUrl: bestThumbnail(detail.snippet.thumbnails),
        durationSeconds: parseDuration(detail.contentDetails.duration),
        viewCount: Number(detail.statistics.viewCount),
        tags: detail.snippet.tags ?? [],
        url: `https://www.youtube.com/watch?v=${i.id.videoId}`,
      };
    });
}
