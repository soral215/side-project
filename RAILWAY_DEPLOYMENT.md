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

