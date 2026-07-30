import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

/**
 * Migrations run over a direct (non-pooled) connection. Neon's pooler doesn't
 * support the session-level statements DDL needs, so `DATABASE_URL_UNPOOLED`
 * takes precedence when present.
 */
/**
 * `drizzle-kit generate` only reads the schema and the snapshot in ./drizzle,
 * so it must work with no database reachable. The placeholder keeps that path
 * open; `migrate`, `push` and `studio` fail fast against this host with a
 * message that names the missing variable.
 */
const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  'postgresql://set-DATABASE_URL@database-url-not-configured/betondispo';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
