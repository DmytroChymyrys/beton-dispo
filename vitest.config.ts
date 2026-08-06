import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    // Playwright specs live in tests/e2e and are run by `npm run test:e2e`.
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@': resolve(root, 'src'),
      // `server-only` throws outside a React Server Component. Modules under
      // test import it as a guard, so it is stubbed here.
      'server-only': resolve(root, 'tests/stubs/server-only.ts'),
    },
  },
});
