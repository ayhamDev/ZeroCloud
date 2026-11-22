import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'domain',
          environment: 'node',
          include: [
            'tests/unit/**/*.test.ts',
            'products/share/packages/{core,contracts}/src/**/*.test.ts',
          ],
        },
      },
      {
        test: {
          name: 'interface',
          environment: 'happy-dom',
          include: ['products/share/apps/web/src/**/*.test.{ts,tsx}'],
          setupFiles: ['./tests/setup-ui.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage/unit',
      include: [
        'products/share/packages/{core,contracts}/src/**/*.ts',
        'products/share/apps/web/src/App.tsx',
      ],
      exclude: ['**/*.test.ts'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
