# E2E 테스트 가이드

이 디렉토리에는 Playwright를 사용한 End-to-End 테스트가 포함되어 있습니다.

## 실행 방법

### 기본 실행
```bash
# 모든 E2E 테스트 실행
pnpm test:e2e

# UI 모드로 실행 (시각적으로 확인 가능)
pnpm test:e2e:ui

# 브라우저를 보면서 실행 (headed mode)
pnpm test:e2e:headed
```

### 특정 테스트만 실행
```bash
# 특정 파일만 실행
pnpm test:e2e e2e/login.spec.ts

# 특정 테스트만 실행
pnpm test:e2e --grep "로그인 페이지가 올바르게 렌더링된다"
```

## 테스트 구조

### login.spec.ts
- 로그인 페이지 렌더링 테스트
- 로그인 폼 검증 테스트
- 실제 로그인 플로우 테스트 (서버 필요)

### register.spec.ts
- 회원가입 페이지 렌더링 테스트
- 회원가입 폼 검증 테스트

## 환경 변수

### SKIP_E2E_WITH_SERVER
실제 서버가 필요한 테스트를 스킵합니다.
```bash
SKIP_E2E_WITH_SERVER=true pnpm test:e2e
```

### TEST_USER_EMAIL, TEST_USER_PASSWORD
실제 로그인 테스트에 사용할 계정 정보
```bash
TEST_USER_EMAIL=test@example.com TEST_USER_PASSWORD=password123 pnpm test:e2e
```

### PLAYWRIGHT_TEST_BASE_URL
테스트할 기본 URL (기본값: http://localhost:3000)
```bash
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000 pnpm test:e2e
```

## 실제 서버와 함께 테스트

1. 백엔드 서버 실행
```bash
cd apps/backend
pnpm dev
```

2. 프론트엔드 서버 실행
```bash
cd apps/frontend
pnpm dev
```

3. E2E 테스트 실행 (서버 필요 테스트 포함)
```bash
# SKIP_E2E_WITH_SERVER를 설정하지 않으면 모든 테스트 실행
pnpm test:e2e
```

## 디버깅

### 테스트 실패 시 스크린샷 확인
테스트 실패 시 자동으로 스크린샷이 저장됩니다:
- `test-results/` 디렉토리 확인

### 비디오 확인
테스트 실패 시 비디오가 저장됩니다:
- `test-results/` 디렉토리 확인

### 트레이스 확인
```bash
# 트레이스 뷰어 실행
pnpm exec playwright show-trace test-results/trace.zip
```

### 디버그 모드
```bash
# 디버그 모드로 실행 (브라우저가 열리고 단계별로 실행)
pnpm exec playwright test --debug
```

## CI/CD

Github Actions에서 자동으로 E2E 테스트가 실행됩니다.
- 실제 서버가 필요한 테스트는 `SKIP_E2E_WITH_SERVER=true`로 스킵됩니다.
- CI 환경에서는 브라우저가 headless 모드로 실행됩니다.

## 주의사항

1. **실제 서버 필요**: 일부 테스트는 실제 백엔드 서버가 실행 중이어야 합니다.
2. **테스트 데이터**: 실제 로그인 테스트를 위해서는 테스트용 계정이 필요합니다.
3. **타이밍**: 네트워크 지연 등을 고려하여 적절한 timeout을 설정해야 합니다.

