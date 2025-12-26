import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    css: true,
    // Playwright E2E 테스트 파일 제외
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/e2e/**', // Playwright 테스트 제외
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@side-project/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});

