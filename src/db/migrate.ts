/**
 * Applies pending migrations from ./drizzle.
 *
 * Run with `npm run db:migrate`. Uses a direct TCP connection (node-postgres)
 * rather than Neon's HTTP driver, because DDL needs a session and Neon accepts
 * ordinary Postgres connections for exactly this purpose.
 */
import { config } from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL is not set. Nothing to migrate.');
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: './drizzle' });
    console.log('Migrations applied.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
