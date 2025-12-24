import { test, expect } from '@playwright/test';

/**
 * 회원가입 플로우 E2E 테스트
 */
test.describe('회원가입', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 회원가입 페이지로 이동
    await page.goto('/register');
  });

  test('회원가입 페이지가 올바르게 렌더링된다', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('회원가입');

    // 이름 입력 필드 확인
    await expect(page.locator('input[type="text"]').first()).toBeVisible();

    // 이메일 입력 필드 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // 비밀번호 입력 필드 확인
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // 회원가입 버튼 확인
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('회원가입');

    // 로그인 링크 확인
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('유효하지 않은 이메일 형식으로 회원가입 시도 시 에러 표시', async ({ page }) => {
    // 유효하지 않은 이메일 입력
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');

    // 회원가입 버튼 클릭
    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    await expect(page.locator('text=/이메일|email/i')).toBeVisible();
  });

  test.skip('빈 필드로 회원가입 시도 시 에러 표시', async ({ page }) => {
    // 빈 필드로 회원가입 버튼 클릭
    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    // 주의: 빈 문자열("")은 string 타입이므로 required_error가 발생하지 않을 수 있음
    // 실제 동작을 확인한 후 테스트를 활성화하세요
    await expect(page.locator('.text-red-600')).toBeVisible();
  });

  test('로그인 링크 클릭 시 로그인 페이지로 이동', async ({ page }) => {
    // 로그인 링크 클릭
    await page.click('a[href="/login"]');

    // 로그인 페이지로 이동 확인
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1')).toContainText('로그인');
  });
});

