/**
 * Title matching utilities for canonical content lookup.
 * Used in the screenshot sync pipeline to match extracted titles
 * to canonical content records.
 */

const ARTICLES = new Set(['the', 'a', 'an', 'le', 'la', 'les', 'el', 'los', 'las']);

/**
 * Normalize a title for comparison.
 * - Lowercases
 * - Removes leading articles (The, A, An)
 * - Strips punctuation
 * - Collapses whitespace
 */
export function normalizeTitle(title: string): string {
  let normalized = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = normalized.split(' ');
  if (words.length > 1 && ARTICLES.has(words[0])) {
    words.shift();
    normalized = words.join(' ');
  }

  return normalized;
}

/**
 * Calculate Levenshtein distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Fuzzy match a query against a list of candidates.
 * Returns candidates sorted by similarity, filtered by threshold.
 * @param query - the search string
 * @param candidates - array of {id, title} objects
 * @param threshold - max allowed Levenshtein distance (default: 3)
 */
export function fuzzyMatch(
  query: string,
  candidates: Array<{ id: string; title: string }>,
  threshold = 3
): Array<{ id: string; title: string; distance: number; score: number }> {
  const normalizedQuery = normalizeTitle(query);

  return candidates
    .map((candidate) => {
      const normalizedTitle = normalizeTitle(candidate.title);
      const distance = levenshtein(normalizedQuery, normalizedTitle);
      const maxLen = Math.max(normalizedQuery.length, normalizedTitle.length);
      const score = maxLen === 0 ? 1 : 1 - distance / maxLen;
      return { ...candidate, distance, score };
    })
    .filter((r) => r.distance <= threshold)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Extract season/episode info from a title string.
 * e.g. "Severance S2 E4" → { season: 2, episode: 4, cleanTitle: "Severance" }
 */
export function extractEpisodeInfo(raw: string): {
  cleanTitle: string;
  season: number | null;
  episode: number | null;
} {
  const seasonEpPattern = /\bS(\d+)\s*E(\d+)\b/i;
  const seasonPattern = /\bSeason\s+(\d+)\b/i;
  const episodePattern = /\bEpisode\s+(\d+)\b/i;

  let cleanTitle = raw;
  let season: number | null = null;
  let episode: number | null = null;

  const seMatch = raw.match(seasonEpPattern);
  if (seMatch) {
    season = parseInt(seMatch[1], 10);
    episode = parseInt(seMatch[2], 10);
    cleanTitle = raw.replace(seasonEpPattern, '').trim();
  } else {
    const sMatch = raw.match(seasonPattern);
    if (sMatch) {
      season = parseInt(sMatch[1], 10);
      cleanTitle = raw.replace(seasonPattern, '').trim();
    }
    const eMatch = raw.match(episodePattern);
    if (eMatch) {
      episode = parseInt(eMatch[1], 10);
      cleanTitle = cleanTitle.replace(episodePattern, '').trim();
    }
  }

  // Clean up trailing separators
  cleanTitle = cleanTitle.replace(/[-–|:]+\s*$/, '').trim();

  return { cleanTitle, season, episode };
}
