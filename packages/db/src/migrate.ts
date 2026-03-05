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

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const sql = postgres(connectionString, { max: 1 });

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
