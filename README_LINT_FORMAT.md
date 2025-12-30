# 린트 및 포맷팅 가이드

이 프로젝트는 통합된 린트 및 포맷팅 설정을 사용합니다.

## 설정 파일

### Prettier
- **루트**: `.prettierrc.json` - 전체 프로젝트 공통 포맷팅 규칙
- **무시 파일**: `.prettierignore`

### ESLint
- **프론트엔드**: `apps/frontend/.eslintrc.json` - Next.js 기본 설정
- **백엔드**: `apps/backend/.eslintrc.json` - TypeScript ESLint 설정
- **Shared**: `packages/shared/.eslintrc.json` - TypeScript ESLint 설정

## 사용 방법

### 린트 실행

```bash
# 전체 프로젝트 린트
pnpm lint

# 특정 패키지만 린트
pnpm --filter @side-project/frontend lint
pnpm --filter @side-project/backend lint
pnpm --filter @side-project/shared lint
```

### 린트 자동 수정

```bash
# 전체 프로젝트 린트 자동 수정
pnpm lint:fix

# 특정 패키지만 린트 자동 수정
pnpm --filter @side-project/frontend lint:fix
pnpm --filter @side-project/backend lint:fix
pnpm --filter @side-project/shared lint:fix
```

### 포맷팅 실행

```bash
# 전체 프로젝트 포맷팅
pnpm format

# 포맷팅 검사만 (수정하지 않음)
pnpm format:check
```

## Prettier 설정

- **세미콜론**: 사용 (`semi: true`)
- **따옴표**: 작은따옴표 (`singleQuote: true`)
- **줄 길이**: 100자 (`printWidth: 100`)
- **들여쓰기**: 2칸 (`tabWidth: 2`)
- **끝 줄**: LF (`endOfLine: "lf"`)

## CI/CD

Github Actions CI에서 자동으로 린트와 포맷팅을 검사합니다:
- PR 생성 시 자동 실행
- 린트 실패 시 CI 실패
- 포맷팅 검사는 경고로 처리 (continue-on-error)

## 권장 워크플로우

1. 코드 작성 후 린트 실행: `pnpm lint`
2. 자동 수정 가능한 문제 수정: `pnpm lint:fix`
3. 포맷팅 적용: `pnpm format`
4. 커밋 전 최종 확인: `pnpm lint && pnpm format:check`


