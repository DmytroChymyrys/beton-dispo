import { config } from 'dotenv';

/**
 * Loads the same environment the app uses, so database-backed tests pick up
 * `DATABASE_URL` without the caller having to export it by hand. Tests that
 * need a database skip themselves when it is absent.
 */
config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });
