/**
 * StaffPicks — Database Seed Script
 *
 * Populates:
 * 1. Content table — seed catalog of well-known titles
 * 2. Taste anchors — 30 curated entries across 10 clusters
 * 3. Platform prompt templates — Claude Vision prompts for each platform
 *
 * Usage: pnpm db:seed
 */

import postgres from 'postgres';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { lookup } from 'dns/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from the package root (packages/db/.env)
try {
  process.loadEnvFile(join(__dirname, '..', '.env'));
} catch {
  // No .env file — env vars must be set externally (e.g. in production)
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

/**
 * Resolve the hostname in a connection string to an IPv4 address.
 * Prevents Node.js from picking IPv6 on networks that block it on port 5432.
 */
async function forceIPv4(cs: string): Promise<string> {
  const match = cs.match(/@([a-zA-Z][a-zA-Z0-9.-]+)(:\d+)\//);
  if (!match) return cs;
  const hostname = match[1];
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return cs;
  try {
    const { address } = await lookup(hostname, { family: 4 });
    console.info(`  🔍 Resolved ${hostname} → ${address}`);
    return cs.replace(`@${hostname}:`, `@${address}:`);
  } catch {
    return cs;
  }
}

const resolvedConnectionString = await forceIPv4(connectionString);
const sql = postgres(resolvedConnectionString, { max: 1, ssl: 'require' });

// ─── Seed Content ─────────────────────────────────────────────────────────────

const SEED_CONTENT = [
  // Prestige TV
  { slug: 'severance', title: 'Severance', type: 'tv', year: 2022, genres: ['sci-fi', 'thriller', 'drama'], platforms: ['apple_tv'], tmdb_id: 95396 },
  { slug: 'the-bear', title: 'The Bear', type: 'tv', year: 2022, genres: ['drama', 'comedy'], platforms: ['hulu'], tmdb_id: 136311 },
  { slug: 'succession', title: 'Succession', type: 'tv', year: 2018, genres: ['drama', 'comedy'], platforms: ['hbo_max'], tmdb_id: 76331 },
  { slug: 'white-lotus', title: 'The White Lotus', type: 'tv', year: 2021, genres: ['drama', 'comedy'], platforms: ['hbo_max'], tmdb_id: 110316 },
  { slug: 'yellowjackets', title: 'Yellowjackets', type: 'tv', year: 2021, genres: ['drama', 'thriller', 'mystery'], platforms: ['paramount_plus', 'hulu'], tmdb_id: 120080 },
  { slug: 'slow-horses', title: 'Slow Horses', type: 'tv', year: 2022, genres: ['thriller', 'drama'], platforms: ['apple_tv'], tmdb_id: 121098 },
  { slug: 'the-last-of-us', title: 'The Last of Us', type: 'tv', year: 2023, genres: ['drama', 'sci-fi', 'horror'], platforms: ['hbo_max'], tmdb_id: 100088 },
  { slug: 'house-of-dragon', title: 'House of the Dragon', type: 'tv', year: 2022, genres: ['fantasy', 'drama'], platforms: ['hbo_max'], tmdb_id: 94997 },
  // Reality
  { slug: 'love-island-uk', title: 'Love Island UK', type: 'tv', year: 2015, genres: ['reality'], platforms: ['hulu', 'peacock'], tmdb_id: 64276 },
  { slug: 'real-housewives-ny', title: 'The Real Housewives of New York City', type: 'tv', year: 2008, genres: ['reality'], platforms: ['peacock'], tmdb_id: 1430 },
  { slug: 'the-traitors', title: 'The Traitors', type: 'tv', year: 2023, genres: ['reality', 'game-show'], platforms: ['peacock'], tmdb_id: 219905 },
  { slug: 'top-chef', title: 'Top Chef', type: 'tv', year: 2006, genres: ['reality', 'food'], platforms: ['peacock'], tmdb_id: 1408 },
  // True Crime
  { slug: 'making-a-murderer', title: 'Making a Murderer', type: 'tv', year: 2015, genres: ['documentary', 'true-crime'], platforms: ['netflix'], tmdb_id: 67619 },
  { slug: 'the-act', title: 'The Act', type: 'tv', year: 2019, genres: ['drama', 'true-crime'], platforms: ['hulu'], tmdb_id: 83868 },
  { slug: 'monster-dahmer', title: 'Monster: The Jeffrey Dahmer Story', type: 'tv', year: 2022, genres: ['drama', 'true-crime'], platforms: ['netflix'], tmdb_id: 143234 },
  // Tech YouTube
  { slug: 'mkbhd-channel', title: 'Marques Brownlee (MKBHD)', type: 'youtube', year: 2009, genres: ['tech', 'reviews'], platforms: ['youtube'] },
  { slug: 'linus-tech-tips', title: 'Linus Tech Tips', type: 'youtube', year: 2008, genres: ['tech'], platforms: ['youtube'] },
  // Comedy TikTok / Short form
  { slug: 'abbott-elementary', title: 'Abbott Elementary', type: 'tv', year: 2021, genres: ['comedy'], platforms: ['hulu', 'disney_plus'], tmdb_id: 124364 },
  { slug: 'what-we-do-shadows', title: 'What We Do in the Shadows', type: 'tv', year: 2019, genres: ['comedy', 'horror'], platforms: ['hulu'], tmdb_id: 83121 },
  { slug: 'schitts-creek', title: "Schitt's Creek", type: 'tv', year: 2015, genres: ['comedy'], platforms: ['netflix'], tmdb_id: 64230 },
  // Anime
  { slug: 'attack-on-titan', title: 'Attack on Titan', type: 'tv', year: 2013, genres: ['anime', 'action', 'drama'], platforms: ['netflix', 'hulu'], tmdb_id: 1429 },
  { slug: 'demon-slayer', title: 'Demon Slayer', type: 'tv', year: 2019, genres: ['anime', 'action'], platforms: ['netflix', 'hulu'], tmdb_id: 85937 },
  { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen', type: 'tv', year: 2020, genres: ['anime', 'action'], platforms: ['hulu'], tmdb_id: 95479 },
  // Documentary
  { slug: 'the-last-dance', title: 'The Last Dance', type: 'tv', year: 2020, genres: ['documentary', 'sports'], platforms: ['netflix'], tmdb_id: 96652 },
  { slug: 'wild-wild-country', title: 'Wild Wild Country', type: 'tv', year: 2018, genres: ['documentary'], platforms: ['netflix'], tmdb_id: 76455 },
  // Sci-fi
  { slug: 'dark', title: 'Dark', type: 'tv', year: 2017, genres: ['sci-fi', 'thriller', 'mystery'], platforms: ['netflix'], tmdb_id: 70523 },
  { slug: 'black-mirror', title: 'Black Mirror', type: 'tv', year: 2011, genres: ['sci-fi', 'anthology', 'thriller'], platforms: ['netflix'], tmdb_id: 42009 },
  { slug: 'foundation', title: 'Foundation', type: 'tv', year: 2021, genres: ['sci-fi', 'drama'], platforms: ['apple_tv'], tmdb_id: 93740 },
  // Family
  { slug: 'bluey', title: 'Bluey', type: 'tv', year: 2018, genres: ['animation', 'family', 'comedy'], platforms: ['disney_plus'], tmdb_id: 85552 },
  { slug: 'ted-lasso', title: 'Ted Lasso', type: 'tv', year: 2020, genres: ['comedy', 'drama'], platforms: ['apple_tv'], tmdb_id: 97546 },
  // Film for variety
  { slug: 'everything-everywhere', title: 'Everything Everywhere All at Once', type: 'movie', year: 2022, genres: ['sci-fi', 'action', 'comedy'], platforms: ['netflix', 'amazon_prime'], tmdb_id: 545611 },
  { slug: 'oppenheimer', title: 'Oppenheimer', type: 'movie', year: 2023, genres: ['drama', 'history'], platforms: ['peacock'], tmdb_id: 872585 },
] as const;

// ─── Taste Anchor Clusters ────────────────────────────────────────────────────

// Maps slug → cluster + discriminating_power + related slugs
const TASTE_ANCHORS: Record<string, { cluster: string; power: number; related: string[] }> = {
  // prestige_tv
  'severance':       { cluster: 'prestige_tv', power: 0.92, related: ['slow-horses', 'dark', 'black-mirror', 'foundation'] },
  'the-bear':        { cluster: 'prestige_tv', power: 0.89, related: ['succession', 'white-lotus', 'abbott-elementary', 'schitts-creek'] },
  'succession':      { cluster: 'prestige_tv', power: 0.91, related: ['white-lotus', 'the-bear', 'slow-horses', 'yellowjackets'] },
  'white-lotus':     { cluster: 'prestige_tv', power: 0.88, related: ['succession', 'the-bear', 'yellowjackets', 'what-we-do-shadows'] },

  // reality
  'love-island-uk':      { cluster: 'reality', power: 0.94, related: ['real-housewives-ny', 'the-traitors', 'top-chef'] },
  'real-housewives-ny':  { cluster: 'reality', power: 0.91, related: ['love-island-uk', 'the-traitors', 'top-chef'] },
  'the-traitors':        { cluster: 'reality', power: 0.88, related: ['love-island-uk', 'real-housewives-ny', 'top-chef'] },

  // true_crime
  'making-a-murderer':  { cluster: 'true_crime', power: 0.95, related: ['wild-wild-country', 'the-act', 'monster-dahmer'] },
  'monster-dahmer':     { cluster: 'true_crime', power: 0.90, related: ['making-a-murderer', 'the-act', 'wild-wild-country'] },
  'the-act':            { cluster: 'true_crime', power: 0.87, related: ['making-a-murderer', 'monster-dahmer', 'yellowjackets'] },

  // tech_youtube
  'mkbhd-channel':   { cluster: 'tech_youtube', power: 0.96, related: ['linus-tech-tips'] },
  'linus-tech-tips': { cluster: 'tech_youtube', power: 0.93, related: ['mkbhd-channel'] },

  // comedy
  'abbott-elementary':  { cluster: 'comedy', power: 0.88, related: ['schitts-creek', 'what-we-do-shadows', 'ted-lasso', 'the-bear'] },
  'schitts-creek':      { cluster: 'comedy', power: 0.90, related: ['abbott-elementary', 'ted-lasso', 'what-we-do-shadows'] },
  'ted-lasso':          { cluster: 'comedy', power: 0.89, related: ['schitts-creek', 'abbott-elementary', 'the-bear'] },

  // anime
  'attack-on-titan':  { cluster: 'anime', power: 0.93, related: ['demon-slayer', 'jujutsu-kaisen'] },
  'demon-slayer':     { cluster: 'anime', power: 0.91, related: ['attack-on-titan', 'jujutsu-kaisen'] },
  'jujutsu-kaisen':   { cluster: 'anime', power: 0.89, related: ['attack-on-titan', 'demon-slayer'] },

  // documentary
  'the-last-dance':   { cluster: 'documentary', power: 0.90, related: ['wild-wild-country', 'making-a-murderer'] },
  'wild-wild-country':{ cluster: 'documentary', power: 0.88, related: ['the-last-dance', 'making-a-murderer'] },

  // scifi
  'dark':         { cluster: 'scifi', power: 0.94, related: ['black-mirror', 'severance', 'foundation'] },
  'black-mirror': { cluster: 'scifi', power: 0.92, related: ['dark', 'severance', 'foundation'] },
  'foundation':   { cluster: 'scifi', power: 0.87, related: ['dark', 'black-mirror', 'severance'] },

  // thriller
  'yellowjackets': { cluster: 'thriller', power: 0.90, related: ['slow-horses', 'dark', 'severance', 'making-a-murderer'] },
  'slow-horses':   { cluster: 'thriller', power: 0.88, related: ['yellowjackets', 'severance', 'dark'] },

  // family
  'bluey':     { cluster: 'family', power: 0.95, related: ['ted-lasso', 'abbott-elementary', 'schitts-creek'] },
};

// ─── Platform Prompt Templates ────────────────────────────────────────────────

const PLATFORM_PROMPTS = [
  {
    platform: 'netflix',
    version: 1,
    ui_description: 'Dark background with red accents. "Continue Watching" row shows progress bars. "Watch Again" means completed.',
    prompt_text: `You are analyzing a Netflix screenshot to extract watch history.

Netflix UI patterns:
- "Continue Watching" row = currently watching (note progress bar percentage under thumbnail)
- "Watch Again" or "Because you watched" rows = previously completed
- Large white title text on dark background
- Episode info shown as "S1 E4" format when applicable

Return ONLY a JSON array with no markdown, no explanation:
[
  {
    "title": "exact title as shown on screen",
    "inferred_status": "watching" | "watched" | "unknown",
    "confidence": 0.0-1.0,
    "metadata": {
      "season": number or null,
      "episode": number or null,
      "episode_title": string or null,
      "progress_percent": number or null,
      "channel_name": null,
      "timestamp": null
    }
  }
]

Extract every title visible. Be conservative with confidence — only use 0.9+ when text is clearly readable.`,
  },
  {
    platform: 'youtube',
    version: 1,
    ui_description: 'Vertical list with thumbnails, video titles, channel names, and relative timestamps like "3 hours ago".',
    prompt_text: `You are analyzing a YouTube watch history screenshot.

YouTube History UI patterns:
- Vertical list of videos with thumbnail on left
- Video title (bold) and channel name below it
- Relative timestamp: "3 hours ago", "Yesterday", "Last week"
- No progress bars — all items are effectively "watched"

Return ONLY a JSON array with no markdown, no explanation:
[
  {
    "title": "exact video title as shown",
    "inferred_status": "watched",
    "confidence": 0.0-1.0,
    "metadata": {
      "season": null,
      "episode": null,
      "episode_title": null,
      "progress_percent": null,
      "channel_name": "channel name if visible",
      "timestamp": "relative timestamp string if visible"
    }
  }
]

Extract every video visible. Include channel names — they're important for matching.`,
  },
  {
    platform: 'disney_plus',
    version: 1,
    ui_description: 'Dark blue background. "Continue Watching" row with progress bars. Similar layout to Netflix.',
    prompt_text: `You are analyzing a Disney+ screenshot to extract watch history.

Disney+ UI patterns:
- "Continue Watching" row = currently watching (progress bar visible)
- "Watchlist" items = want to watch (do NOT include these)
- Dark blue/black background with white text
- Series shown with season/episode info when applicable

Return ONLY a JSON array with no markdown, no explanation:
[
  {
    "title": "exact title as shown",
    "inferred_status": "watching" | "watched" | "unknown",
    "confidence": 0.0-1.0,
    "metadata": {
      "season": number or null,
      "episode": number or null,
      "episode_title": string or null,
      "progress_percent": number or null,
      "channel_name": null,
      "timestamp": null
    }
  }
]

Only include items in "Continue Watching" or recently watched rows — not Watchlist items.`,
  },
  {
    platform: 'hulu',
    version: 1,
    ui_description: 'Green accent color. "Keep Watching" row = currently watching.',
    prompt_text: `You are analyzing a Hulu screenshot to extract watch history.

Hulu UI patterns:
- "Keep Watching" row = currently watching (progress bars visible)
- Dark background with green "#1CE783" accent color
- Episode info when applicable
- "My Stuff" section may include watchlist items — skip those

Return ONLY a JSON array with no markdown, no explanation:
[
  {
    "title": "exact title as shown",
    "inferred_status": "watching" | "watched" | "unknown",
    "confidence": 0.0-1.0,
    "metadata": {
      "season": number or null,
      "episode": number or null,
      "episode_title": string or null,
      "progress_percent": number or null,
      "channel_name": null,
      "timestamp": null
    }
  }
]

Focus on "Keep Watching" items. Include any recently watched content visible on screen.`,
  },
  {
    platform: 'apple_tv',
    version: 1,
    ui_description: 'Light or dark mode. "Up Next" row shows current queue. Clean minimal design.',
    prompt_text: `You are analyzing an Apple TV+ screenshot to extract watch history.

Apple TV+ UI patterns:
- "Up Next" row = currently watching or queued (progress bar indicates in-progress)
- Clean, minimal design — light or dark mode
- Large poster artwork with title overlay
- Episode info shown when applicable

Return ONLY a JSON array with no markdown, no explanation:
[
  {
    "title": "exact title as shown",
    "inferred_status": "watching" | "watched" | "unknown",
    "confidence": 0.0-1.0,
    "metadata": {
      "season": number or null,
      "episode": number or null,
      "episode_title": string or null,
      "progress_percent": number or null,
      "channel_name": null,
      "timestamp": null
    }
  }
]

Include items from "Up Next" with progress bars (these are in-progress).`,
  },
  {
    platform: 'hbo_max',
    version: 1,
    ui_description: 'Dark purple/blue UI. "Continue Watching" row with progress indicators.',
    prompt_text: `You are analyzing an HBO Max (Max) screenshot to extract watch history.

Max UI patterns:
- "Continue Watching" row = currently watching
- Dark purple-blue background (#1a1a2e)
- Episode info shown as "Season X Episode Y" or "SXeY"
- Progress bar or percentage under thumbnails

Return ONLY a JSON array with no markdown, no explanation:
[
  {
    "title": "exact title as shown",
    "inferred_status": "watching" | "watched" | "unknown",
    "confidence": 0.0-1.0,
    "metadata": {
      "season": number or null,
      "episode": number or null,
      "episode_title": string or null,
      "progress_percent": number or null,
      "channel_name": null,
      "timestamp": null
    }
  }
]

Extract all items visible in "Continue Watching" and recently finished rows.`,
  },
];

// ─── Main Seed Function ────────────────────────────────────────────────────────

async function seed() {
  console.info('🌱 StaffPicks — Running seed script...\n');

  // 1. Insert content
  console.info('📺 Seeding content catalog...');
  const contentIdMap: Record<string, string> = {};

  for (const item of SEED_CONTENT) {
    const [existing] = await sql`
      SELECT id FROM content WHERE title = ${item.title} LIMIT 1
    `;

    if (existing) {
      contentIdMap[item.slug] = existing.id;
      console.info(`   ⏭  ${item.title} (already exists)`);
      continue;
    }

    const platforms = (item.platforms as readonly string[]).map((p) => ({ platform: p }));
    const externalIds = 'tmdb_id' in item && item.tmdb_id ? { tmdb_id: item.tmdb_id } : {};

    const [inserted] = await sql`
      INSERT INTO content (content_type, title, metadata, platform_availability, external_ids)
      VALUES (
        ${item.type as string},
        ${item.title},
        ${sql.json({ year: item.year, genres: [...item.genres] })},
        ${sql.json(platforms)},
        ${sql.json(externalIds)}
      )
      RETURNING id
    `;

    contentIdMap[item.slug] = inserted.id;
    console.info(`   ✓  ${item.title}`);
  }

  console.info(`\n   → ${Object.keys(contentIdMap).length} content entries ready.\n`);

  // 2. Insert taste anchors
  console.info('🎯 Seeding taste anchors...');
  let anchorCount = 0;

  for (const [slug, anchor] of Object.entries(TASTE_ANCHORS)) {
    const contentId = contentIdMap[slug];
    if (!contentId) {
      console.info(`   ⚠  Skipping anchor for unknown slug: ${slug}`);
      continue;
    }

    const relatedIds = anchor.related
      .map((r) => contentIdMap[r])
      .filter(Boolean);

    const [existing] = await sql`
      SELECT id FROM taste_anchors WHERE content_id = ${contentId} AND cluster = ${anchor.cluster}
    `;

    if (existing) {
      await sql`
        UPDATE taste_anchors
        SET related_content_ids = ${sql.json(relatedIds)},
            discriminating_power = ${anchor.power},
            updated_at = NOW()
        WHERE id = ${existing.id}
      `;
    } else {
      await sql`
        INSERT INTO taste_anchors (content_id, cluster, related_content_ids, discriminating_power)
        VALUES (${contentId}, ${anchor.cluster}, ${sql.json(relatedIds)}, ${anchor.power})
      `;
      anchorCount++;
    }

    console.info(`   ✓  ${slug} → [${anchor.cluster}] (power: ${anchor.power})`);
  }

  console.info(`\n   → ${anchorCount} taste anchors inserted.\n`);

  // 3. Insert platform prompt templates
  console.info('💬 Seeding platform prompt templates...');
  let promptCount = 0;

  for (const tmpl of PLATFORM_PROMPTS) {
    const [existing] = await sql`
      SELECT id FROM platform_prompt_templates
      WHERE platform = ${tmpl.platform} AND version = ${tmpl.version}
    `;

    if (existing) {
      console.info(`   ⏭  ${tmpl.platform} v${tmpl.version} (already exists)`);
      continue;
    }

    await sql`
      INSERT INTO platform_prompt_templates (platform, version, prompt_text, ui_description, active)
      VALUES (${tmpl.platform}, ${tmpl.version}, ${tmpl.prompt_text}, ${tmpl.ui_description}, true)
    `;
    promptCount++;
    console.info(`   ✓  ${tmpl.platform} v${tmpl.version}`);
  }

  console.info(`\n   → ${promptCount} prompt templates inserted.\n`);

  // Summary
  console.info('─────────────────────────────────────────');
  console.info('✅  Seed complete!\n');
  console.info(`   Content entries:        ${Object.keys(contentIdMap).length}`);
  console.info(`   Taste anchors:          ${Object.keys(TASTE_ANCHORS).length}`);
  console.info(`   Platform prompt templates: ${PLATFORM_PROMPTS.length}`);

  await sql.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
