import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/staffpicks',
  },
  verbose: true,
  strict: true,
} satisfies Config;
