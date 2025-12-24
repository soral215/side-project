# 모노레포 사이드 프로젝트

Turborepo를 사용한 모노레포 구조의 사이드 프로젝트입니다. 백엔드(Express)와 프론트엔드(Next.js)를 함께 관리하며, 공통 타입과 유틸리티를 공유합니다.

## 프로젝트 구조

```
side-project/
├── apps/
│   ├── frontend/          # Next.js 14 프론트엔드
│   └── backend/          # Express + TypeScript 백엔드
├── packages/
│   └── shared/           # 공통 타입 및 유틸리티
├── package.json          # 루트 package.json
├── turbo.json            # Turborepo 설정
└── pnpm-workspace.yaml   # pnpm 워크스페이스 설정
```

## 기술 스택

### 프론트엔드
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React 18

### 백엔드
- Express
- TypeScript
- CORS

### 공통
- Turborepo (모노레포 관리)
- pnpm (패키지 매니저)
- TypeScript

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- pnpm 8 이상

### 설치

```bash
# 의존성 설치
pnpm install
```

### 개발 서버 실행

```bash
# 모든 앱 동시 실행 (프론트엔드 + 백엔드)
pnpm dev

# 개별 실행
pnpm --filter @side-project/frontend dev
pnpm --filter @side-project/backend dev
```

### 빌드

```bash
# 모든 앱 빌드
pnpm build

# 개별 빌드
pnpm --filter @side-project/frontend build
pnpm --filter @side-project/backend build
```

### 기타 명령어

```bash
# 타입 체크
pnpm type-check

# 린트
pnpm lint

# 정리
pnpm clean
```

## 포트

- 프론트엔드: http://localhost:3000
- 백엔드: http://localhost:3001

## 공통 패키지 사용

프론트엔드와 백엔드에서 공통 타입을 사용할 수 있습니다:

```typescript
import { User, ApiResponse, createApiResponse } from '@side-project/shared';
```

## 프로젝트별 README

- [프론트엔드](./apps/frontend/README.md)
- [백엔드](./apps/backend/README.md)

## 배포 가이드

- [Railway 배포 가이드](./RAILWAY_DEPLOYMENT.md) - 백엔드 배포 및 트러블슈팅 포함
- [Vercel 배포 가이드](./VERCEL_DEPLOYMENT.md) - 프론트엔드 배포

## 라이선스

MIT


