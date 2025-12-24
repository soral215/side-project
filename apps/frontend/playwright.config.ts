import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 설정 파일
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* 테스트 파일 패턴 */
  testMatch: /.*\.spec\.ts/,
  /* 테스트 타임아웃 (30초) */
  timeout: 30 * 1000,
  /* 테스트 실패 시 재시도 횟수 */
  retries: process.env.CI ? 2 : 0,
  /* 병렬 실행할 워커 수 */
  workers: process.env.CI ? 1 : undefined,
  /* 리포트 설정 */
  reporter: process.env.CI ? 'html' : 'list',
  /* 공유 설정 */
  use: {
    /* 기본 타임아웃 */
    actionTimeout: 10 * 1000,
    /* 스크린샷 설정 */
    screenshot: 'only-on-failure',
    /* 비디오 녹화 설정 */
    video: 'retain-on-failure',
    /* 트레이스 설정 (디버깅용) */
    trace: 'on-first-retry',
    /* 기본 URL */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
  },

  /* 테스트할 브라우저 설정 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 필요시 다른 브라우저 추가
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* 개발 서버 설정 */
  webServer: {
    command: 'cd ../.. && pnpm --filter @side-project/frontend dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});

