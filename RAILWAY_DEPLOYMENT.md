# Railway 배포 가이드

이 문서는 모노레포의 백엔드 앱을 Railway에 배포하는 방법을 설명합니다.

## 📋 사전 준비사항

1. Railway 계정 생성: https://railway.app
2. GitHub 저장소 준비 (Railway는 Git 연동을 통해 배포)

## 🚀 배포 단계

### 1단계: Railway 프로젝트 생성

1. [Railway 대시보드](https://railway.app/dashboard) 접속
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. GitHub 저장소 연결 및 선택

### 2단계: PostgreSQL 데이터베이스 추가

1. 프로젝트 대시보드에서 "+ New" 클릭
2. "Database" → "Add PostgreSQL" 선택
3. PostgreSQL 서비스가 생성되면 자동으로 `DATABASE_URL` 환경 변수가 설정됩니다

### 3단계: 백엔드 서비스 추가

1. 프로젝트 대시보드에서 "+ New" 클릭
2. "GitHub Repo" 선택
3. 같은 저장소 선택
4. 서비스 설정:
   - **Root Directory**: (비워두거나 루트 디렉토리로 설정)
   - **Build Command**: (자동 감지 - `nixpacks.toml` 사용)
   - **Start Command**: (자동 감지 - `nixpacks.toml` 사용)
   
   > ✅ **최적화 완료**: `nixpacks.toml` 파일이 루트 디렉토리에 있어서 Railway가 자동으로 빌드 및 시작 명령어를 감지합니다. 별도 설정이 필요 없습니다.

### 4단계: 환경 변수 설정

백엔드 서비스 → Variables 탭에서 다음 환경 변수 추가:

#### 필수 환경 변수

```
DATABASE_URL=<Railway PostgreSQL에서 자동 생성됨>
JWT_SECRET=<랜덤 문자열 생성>
FRONTEND_URL=<Vercel 프론트엔드 URL>
NODE_ENV=production
```

#### 선택 환경 변수 (Cloudinary 사용 시)

```
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
```

### 5단계: Prisma 마이그레이션 실행

#### 방법 1: 자동 마이그레이션 (권장)

`railway-build` 스크립트를 사용하면 마이그레이션이 자동으로 실행됩니다:

Railway 대시보드 → Settings → Build → Build Command:
```
cd apps/backend && pnpm railway-build
```

또는 `nixpacks.toml`의 빌드 단계에 추가:
```toml
[phases.build]
cmds = [
  "cd apps/backend",
  "prisma generate",
  "prisma migrate deploy",
  "tsc"
]
```

#### 방법 2: 수동 마이그레이션

Railway CLI 사용:

```bash
# Railway CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 마이그레이션 실행
railway run --service <service-name> pnpm --filter @side-project/backend migrate
```

또는 Railway 대시보드에서:
1. 백엔드 서비스 → Deployments → 최신 배포 클릭
2. "View Logs" 클릭
3. "Run Command"에서 `pnpm --filter @side-project/backend migrate` 실행

### 6단계: 배포 확인

1. Railway 대시보드에서 배포 상태 확인
2. 서비스 URL 확인 (예: `https://your-app.railway.app`)
3. Health check: `https://your-app.railway.app/health`

## ⚙️ 설정 파일 설명

### `nixpacks.toml` (루트 디렉토리)

Railway 빌드 설정 (최적화됨):
- **Node.js 버전**: 20.x
- **패키지 매니저**: pnpm
- **빌드 단계**: 
  1. `pnpm install --frozen-lockfile` (의존성 설치)
  2. `cd apps/backend && prisma generate` (Prisma Client 생성)
  3. `tsc` (TypeScript 컴파일)
- **시작 명령어**: `cd apps/backend && node dist/server.js`

### `apps/backend/railway.json`

Railway 배포 설정 (선택사항):
- `builder`: NIXPACKS (자동 빌드 감지)
- `startCommand`: 서비스 시작 명령어 (nixpacks.toml이 우선)
- `restartPolicyType`: 실패 시 재시작 정책

### `apps/backend/package.json` 스크립트

- `build`: `prisma generate && tsc` (단순화됨)
- `start`: `node dist/server.js`
- `postinstall`: Prisma Client 자동 생성
- `migrate`: 프로덕션 마이그레이션 실행
- `migrate:dev`: 개발 환경 마이그레이션
- `railway-build`: `prisma generate && prisma migrate deploy && tsc` (자동 마이그레이션 포함)

## 🔄 자동 배포

GitHub 저장소와 연결하면:

- **메인 브랜치 푸시** → 자동 배포
- **다른 브랜치 푸시** → 프리뷰 배포 (선택사항)

## 📊 모니터링

Railway 대시보드에서:
- 실시간 로그 확인
- 메트릭 모니터링 (CPU, 메모리, 네트워크)
- 배포 히스토리
- 환경 변수 관리

## 🔐 데이터베이스 관리

### Prisma Studio (로컬)

```bash
cd apps/backend
DATABASE_URL=<railway_postgresql_url> npx prisma studio
```

### 마이그레이션

```bash
# 개발 환경
pnpm migrate:dev

# 프로덕션 (Railway)
railway run pnpm migrate
```

## 🌐 도메인 설정

1. Railway 프로젝트 → Settings → Domains
2. "Generate Domain" 클릭 또는 커스텀 도메인 추가
3. DNS 설정 (커스텀 도메인 사용 시)

## 🐛 문제 해결

### 빌드 실패

1. **모노레포 의존성 문제**:
   - Root Directory를 비워두거나 루트 디렉토리로 설정
   - `nixpacks.toml`이 루트 디렉토리에 있는지 확인
   - 빌드 로그에서 `pnpm install --frozen-lockfile`가 실행되었는지 확인

2. **`dist/server.js`를 찾을 수 없음**:
   - 빌드 로그에서 다음 단계가 모두 실행되었는지 확인:
     1. `pnpm install --frozen-lockfile` ✅
     2. `cd apps/backend` ✅
     3. `prisma generate` ✅
     4. `tsc` ✅
   - 빌드 로그에서 TypeScript 컴파일 에러가 있는지 확인
   - `apps/backend/tsconfig.json` 설정 확인

3. **Prisma Client 생성 실패**:
   - `DATABASE_URL` 환경 변수가 설정되었는지 확인 (Prisma generate는 DB 연결이 필요 없지만, 마이그레이션은 필요)
   - 빌드 로그에서 `prisma generate` 실행 여부 확인

4. **마이그레이션 실패**:
   - PostgreSQL 서비스가 실행 중인지 확인
   - `DATABASE_URL`이 올바른지 확인
   - 마이그레이션은 빌드 단계가 아닌 배포 후 별도로 실행해야 함 (또는 `railway-build` 스크립트 사용)

5. **TypeScript 컴파일 에러**:
   - 로컬에서 `pnpm --filter @side-project/backend type-check` 실행하여 에러 확인
   - `@side-project/shared` 패키지가 제대로 빌드되었는지 확인

### 로그 확인

Railway 대시보드 → 서비스 → Deployments → 최신 배포 → View Logs

### 포트 문제

Railway는 자동으로 `PORT` 환경 변수를 제공합니다. 코드에서 `process.env.PORT`를 사용하면 됩니다.

---

## 🔧 실제 발생한 문제 및 해결 과정

이 섹션은 실제 배포 과정에서 발생한 문제들과 해결 방법을 상세히 기록합니다.

### 1. Prisma Provider 불일치 오류

**오류 메시지:**
```
Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`
```

**원인:**
- `schema.prisma`가 `provider = "postgresql"`로 설정되어 있었음
- 로컬 `.env`는 `DATABASE_URL="file:./dev.db"` (SQLite)로 설정되어 있었음
- Prisma가 PostgreSQL URL을 기대했지만 SQLite URL을 받아서 오류 발생

**해결 방법:**
- `apps/backend/scripts/setup-prisma.js` 스크립트 생성
- `DATABASE_URL` 환경 변수를 확인하여 자동으로 provider 변경
- 로컬: SQLite 유지 (`file:./dev.db`)
- Railway: PostgreSQL로 자동 전환 (`postgresql://` 또는 `postgres://`로 시작)

**관련 파일:**
- `apps/backend/scripts/setup-prisma.js`
- `apps/backend/prisma/schema.prisma` (기본값: `provider = "sqlite"`)

---

### 2. Nixpacks 빌드 오류

**오류 메시지:**
```
error: undefined variable 'nodejs-20_x'
```

**원인:**
- `nixpacks.toml`에서 잘못된 패키지 이름 사용
- Nix 패키지 이름 규칙을 따르지 않음

**해결 방법:**
- `nodejs-20_x` → `nodejs-20`으로 변경
- 이후 Railway 대시보드 설정을 직접 사용하도록 `nixpacks.toml` 비활성화 (`.disabled`로 변경)

**관련 파일:**
- `nixpacks.toml.disabled` (비활성화됨)
- Railway 대시보드 → Settings → Build에서 직접 설정

---

### 3. Prisma 마이그레이션 Provider 불일치

**오류 메시지:**
```
Error: P3019 The datasource provider `postgresql` specified in your schema does not match the one specified in the migration_lock.toml, `sqlite`.
```

**원인:**
- 로컬에서 SQLite로 생성된 마이그레이션 파일들이 Git에 포함됨
- 프로덕션에서 PostgreSQL을 사용하려고 할 때 마이그레이션 히스토리 충돌

**해결 방법:**
- `prisma migrate deploy` 대신 `prisma db push --accept-data-loss` 사용
- 프로덕션에서는 마이그레이션 히스토리를 무시하고 스키마를 직접 동기화
- 로컬과 프로덕션의 마이그레이션을 분리하여 관리

**관련 파일:**
- `apps/backend/package.json` → `railway-start` 스크립트

---

### 4. TypeScript 컴파일 경로 문제

**오류 메시지:**
```
Error: Cannot find module '/app/apps/backend/dist/server.js'
```

**원인:**
- `tsc`가 모노레포 구조를 반영하여 `dist/apps/backend/src/server.js`로 컴파일됨
- `railway-start` 스크립트가 `dist/server.js`를 찾으려고 시도

**해결 과정:**
1. `tsconfig.json`에서 `rootDir` 제거 (TypeScript가 자동으로 공통 루트 감지)
2. `railway-start` 스크립트의 경로를 실제 출력 경로로 수정: `dist/apps/backend/src/server.js`

**관련 파일:**
- `apps/backend/tsconfig.json`
- `apps/backend/package.json` → `railway-start` 스크립트

---

### 5. 모노레포 빌드 순서 문제

**오류 메시지:**
```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts" for /app/packages/shared/src/index.ts
```

**원인:**
- `packages/shared`가 컴파일되지 않은 상태에서 백엔드가 빌드됨
- 백엔드가 `@side-project/shared`의 TypeScript 파일을 직접 import 시도
- 수동 빌드 스크립트에서 빌드 순서가 보장되지 않음

**해결 방법:**
- 터보레포 방식으로 전환
- `packages/shared/package.json`에 `build` 스크립트 추가: `"build": "tsc"`
- `apps/backend/package.json`의 `railway-build`를 터보레포 명령으로 변경:
  ```json
  "railway-build": "cd ../.. && turbo run build --filter=@side-project/backend"
  ```
- 터보레포가 `turbo.json`의 `dependsOn: ["^build"]` 설정에 따라 자동으로 `packages/shared`를 먼저 빌드

**관련 파일:**
- `packages/shared/package.json`
- `apps/backend/package.json`
- `turbo.json`

---

### 6. ES 모듈 Import 문제

**오류 메시지:**
```
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/app/packages/shared/dist/types' is not supported resolving ES modules
```

**원인:**
- ES 모듈에서는 디렉토리 import가 지원되지 않음
- `./types` 같은 경로로 import 시도
- `packages/shared/package.json`에 `"type": "module"`이 없어서 모듈 타입이 불명확

**해결 방법:**
1. `packages/shared/package.json`에 `"type": "module"` 추가
2. 모든 import 경로에 확장자 추가:
   - `'./types'` → `'./types/index.js'`
   - `'./utils'` → `'./utils/index.js'`
   - `'./validations'` → `'./validations/index.js'`
3. `validations/index.ts`의 import도 확장자 추가:
   - `'./user.schema'` → `'./user.schema.js'`

**주의사항:**
- TypeScript에서 ES 모듈을 사용할 때는 import 경로에 `.js` 확장자를 사용해야 함
- TypeScript는 컴파일 시 `.ts`를 `.js`로 변환하므로, 소스 코드에서도 `.js`를 사용해야 런타임에서 올바르게 해석됨

**관련 파일:**
- `packages/shared/package.json`
- `packages/shared/src/index.ts`
- `packages/shared/src/validations/index.ts`

---

### 7. 테스트 파일 컴파일 오류

**오류 메시지:**
```
error TS2582: Cannot find name 'describe'. Do you need to install type definitions for a test runner?
```

**원인:**
- `packages/shared/tsconfig.json`에서 테스트 파일이 제외되지 않음
- 빌드 시 테스트 파일(`__tests__/index.test.ts`)까지 컴파일 시도
- Jest 타입 정의가 없어서 `describe`, `it`, `expect` 등을 인식하지 못함

**해결 방법:**
- `packages/shared/tsconfig.json`의 `exclude`에 추가:
  ```json
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/__tests__/**"]
  ```

**관련 파일:**
- `packages/shared/tsconfig.json`

---

## 📚 핵심 교훈

### 1. 모노레포 환경에서의 빌드 순서 관리
- 터보레포의 `dependsOn` 설정을 활용하여 의존성 패키지를 자동으로 먼저 빌드
- 수동 빌드 스크립트보다 터보레포를 통한 빌드가 더 안정적

### 2. ES 모듈 사용 시 주의사항
- 디렉토리 import 불가: `'./types'` ❌ → `'./types/index.js'` ✅
- 모든 import에 확장자 필요: `.js` 확장자 사용
- `package.json`에 `"type": "module"` 명시

### 3. 개발/프로덕션 환경 분리
- `setup-prisma.js` 스크립트로 provider 자동 전환
- 로컬: SQLite, 프로덕션: PostgreSQL

### 4. TypeScript 컴파일 경로
- 모노레포에서는 `rootDir` 제거 권장 (자동 감지)
- 실제 출력 경로에 맞춰 실행 경로 설정

### 5. 마이그레이션 관리
- 로컬과 프로덕션의 마이그레이션을 분리
- 프로덕션에서는 `prisma db push` 사용 고려 (초기 배포 시)

---

## ✅ 최종 해결된 상태

- ✅ 서버 정상 시작
- ✅ Prisma PostgreSQL 연결 성공
- ✅ 데이터베이스 스키마 동기화 완료
- ✅ 터보레포를 통한 빌드 순서 자동 관리
- ✅ ES 모듈 import 문제 해결
- ⚠️ Cloudinary 환경 변수 설정 필요 (선택사항)

## 📝 주의사항

### SQLite → PostgreSQL 전환

- 개발 환경에서는 여전히 SQLite 사용 가능
- 프로덕션은 PostgreSQL 사용
- 마이그레이션 시 데이터 마이그레이션 필요

### 환경 변수 관리

- 민감한 정보는 Railway 환경 변수로 관리
- `.env` 파일은 Git에 커밋하지 않음

### Socket.io

- Railway는 WebSocket을 완전히 지원합니다
- Socket.io 연결이 정상적으로 작동합니다

## 🔗 관련 문서

- [Railway 공식 문서](https://docs.railway.app)
- [Prisma 배포 가이드](https://www.prisma.io/docs/guides/deployment)
- [Express 배포 가이드](https://expressjs.com/en/advanced/best-practice-performance.html)

## 💰 가격

- **무료 플랜**: $5 크레딧/월
- **유료 플랜**: 사용량 기반
  - RAM: $0.000463/GB-hour
  - Storage: $0.000231/GB-hour

## 📋 체크리스트

배포 전 확인사항:

- [ ] Railway 계정 생성 및 프로젝트 생성
- [ ] PostgreSQL 서비스 추가
- [ ] 백엔드 서비스 추가 (Root Directory: 루트 디렉토리)
- [ ] 환경 변수 설정 (DATABASE_URL, JWT_SECRET, FRONTEND_URL 등)
- [ ] Prisma 스키마가 PostgreSQL로 설정됨
- [ ] `nixpacks.toml` 파일이 루트 디렉토리에 있음 (최적화됨)
- [ ] `apps/backend/package.json`에 빌드 스크립트가 최적화됨
- [ ] 로컬에서 `pnpm --filter @side-project/backend build` 테스트 성공
- [ ] 첫 배포 후 마이그레이션 실행 (또는 `railway-build` 스크립트 사용)
- [ ] Health check 엔드포인트 테스트 (`/health`)
- [ ] 프론트엔드에서 백엔드 URL 업데이트

## ✨ 최적화 완료 사항

- ✅ Node.js 버전 업그레이드 (18 → 20)
- ✅ 빌드 스크립트 단순화 (불필요한 디버깅 제거)
- ✅ `nixpacks.toml` 최적화 (루트 디렉토리)
- ✅ `railway.json` 단순화
- ✅ `package.json` 빌드 스크립트 최적화
- ✅ 자동 마이그레이션 옵션 추가 (`railway-build` 스크립트)

