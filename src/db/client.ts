import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export type Database = NeonHttpDatabase<typeof schema>;

function isLocalConnection(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

/**
 * Production runs on Neon over HTTP: one round trip per query and no TCP
 * connection pool to exhaust across serverless invocations.
 *
 * A `localhost` connection string switches to node-postgres so a plain local
 * Postgres (and CI) can run the app and the end-to-end tests without a cloud
 * database. Only the query-builder surface we use — select / insert / update /
 * delete, no transactions — is exercised, and that surface is identical between
 * the two drivers, which is what makes the cast below safe.
 */
async function create(url: string): Promise<Database> {
  if (isLocalConnection(url)) {
    const [{ Pool }, { drizzle }] = await Promise.all([
      import('pg'),
      import('drizzle-orm/node-postgres'),
    ]);
    return drizzle(new Pool({ connectionString: url, max: 5 }), { schema }) as unknown as Database;
  }

  return drizzleNeon(neon(url), { schema });
}

let cached: Promise<Database> | null = null;

/**
 * Resolved lazily so a build without `DATABASE_URL` (for example a preview that
 * only prerenders marketing pages) doesn't fail at import time; the error
 * surfaces on the first query instead.
 */
export function getDb(): Promise<Database> {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    return Promise.reject(
      new Error(
        'DATABASE_URL is not set. Connect the Neon integration in Vercel, or copy the ' +
          'pooled connection string into .env.local for local development.',
      ),
    );
  }

  cached = create(url);
  return cached;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
