/**
 * Database migration runner.
 * Reads all .sql files from /migrations in order and executes them.
 *
 * Usage: pnpm db:migrate
 */

import postgres from 'postgres';
import { readdir, readFile } from 'fs/promises';
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

const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

/**
 * Resolve the hostname in a connection string to an IPv4 address.
 * Prevents Node.js from picking IPv6 on networks that block it on port 5432.
 */
async function forceIPv4(connectionString: string): Promise<string> {
  const match = connectionString.match(/@([a-zA-Z][a-zA-Z0-9.-]+)(:\d+)\//);
  if (!match) return connectionString;
  const hostname = match[1];
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return connectionString; // already an IP
  try {
    const { address } = await lookup(hostname, { family: 4 });
    console.info(`  🔍 Resolved ${hostname} → ${address}`);
    return connectionString.replace(`@${hostname}:`, `@${address}:`);
  } catch {
    return connectionString; // fall back to original on DNS failure
  }
}

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const resolved = await forceIPv4(connectionString);
  const sql = postgres(resolved, { max: 1, ssl: 'require' });

  console.info('🗄️  StaffPicks — Running migrations...');

  // Create migrations tracking table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS "_migrations" (
      "filename" TEXT PRIMARY KEY,
      "ran_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Get already-run migrations
  const ran = await sql`SELECT filename FROM "_migrations"`;
  const ranSet = new Set(ran.map((r) => r.filename));

  // Get all migration files sorted alphabetically
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    if (ranSet.has(file)) {
      console.info(`  ⏭  ${file} (already run)`);
      continue;
    }

    const filePath = join(MIGRATIONS_DIR, file);
    const sqlContent = await readFile(filePath, 'utf-8');

    console.info(`  ▶  Running ${file}...`);
    await sql.unsafe(sqlContent);
    await sql`INSERT INTO "_migrations" ("filename") VALUES (${file})`;
    count++;
    console.info(`  ✓  ${file}`);
  }

  if (count === 0) {
    console.info('  Nothing to run — database is up to date.');
  } else {
    console.info(`\n✅  ${count} migration(s) applied.`);
  }

  await sql.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
