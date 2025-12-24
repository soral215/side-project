import { test, expect } from '@playwright/test';

/**
 * 로그인 플로우 E2E 테스트
 */
test.describe('로그인', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 페이지로 이동
    await page.goto('/login');
  });

  test('로그인 페이지가 올바르게 렌더링된다', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('로그인');

    // 이메일 입력 필드 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // 비밀번호 입력 필드 확인
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // 로그인 버튼 확인
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('로그인');

    // 회원가입 링크 확인
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('유효하지 않은 이메일 형식으로 로그인 시도 시 에러 표시', async ({ page }) => {
    // 유효하지 않은 이메일 입력
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');

    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');

    // 에러 메시지 확인 (Zod 검증 에러)
    await expect(page.locator('text=/이메일|email/i')).toBeVisible();
  });

  test('빈 필드로 로그인 시도 시 에러 표시', async ({ page }) => {
    // 빈 필드로 로그인 버튼 클릭
    await page.click('button[type="submit"]');

    // 에러 메시지 확인 (한국어 에러 메시지)
    await expect(page.locator('text=/입력해주세요/i')).toBeVisible();
  });

  test('회원가입 링크 클릭 시 회원가입 페이지로 이동', async ({ page }) => {
    // 회원가입 링크 클릭
    await page.click('a[href="/register"]');

    // 회원가입 페이지로 이동 확인
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.locator('h1')).toContainText('회원가입');
  });
});

/**
 * 실제 로그인 플로우 테스트
 * 주의: 실제 백엔드 서버가 실행 중이어야 합니다
 */
test.describe('로그인 플로우 (실제 서버 필요)', () => {
  test.skip(
    process.env.SKIP_E2E_WITH_SERVER === 'true',
    '실제 서버가 필요한 테스트는 환경 변수로 스킵 가능'
  );

  test('올바른 자격증명으로 로그인 성공', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('/login');

    // 테스트용 계정 정보 입력
    // 주의: 실제 테스트 환경에서는 테스트용 계정이 필요합니다
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'password123';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');

    // 로그인 성공 후 메인 페이지로 이동 확인
    await expect(page).toHaveURL(/.*\/$/);
    await expect(page).not.toHaveURL(/.*\/login/);

    // 사용자 정보가 표시되는지 확인 (메인 페이지에 사용자 정보가 있다면)
    // await expect(page.locator('text=' + testEmail)).toBeVisible();
  });

  test('잘못된 자격증명으로 로그인 시도 시 에러 표시', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('/login');

    // 잘못된 자격증명 입력
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');

    // 에러 메시지 확인 (alert 또는 에러 메시지)
    // alert의 경우 page.on('dialog')로 처리해야 합니다
    const dialogPromise = page.waitForEvent('dialog');
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('로그인');
    await dialog.accept();
  });
});

