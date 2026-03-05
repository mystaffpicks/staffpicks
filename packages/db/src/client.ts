import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Disable prefetch for transaction support
const queryClient = postgres(connectionString, { prepare: false });
export const db = drizzle(queryClient, { schema, logger: process.env.NODE_ENV === 'development' });

export type Database = typeof db;
