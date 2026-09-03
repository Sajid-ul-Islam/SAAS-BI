import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/shared/utils/**',
        'src/lib/auth-utils.ts',
        'src/modules/**/*.schema.ts',
        'src/modules/**/*.service.ts',
      ],
      exclude: ['**/*.types.ts', '**/*.repository.ts', '**/index.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
