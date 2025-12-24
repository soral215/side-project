# Vercel 배포 가이드

이 문서는 모노레포의 프론트엔드 앱을 Vercel에 배포하는 방법을 설명합니다.

## 📋 사전 준비사항

1. Vercel 계정 생성: https://vercel.com
2. Vercel CLI 설치 (선택사항):
   ```bash
   npm i -g vercel
   ```

## 🚀 배포 방법

### 방법 1: Vercel 대시보드 사용 (권장)

#### 1단계: 프로젝트 생성

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. "Add New Project" 클릭
3. Git 저장소 연결 (GitHub, GitLab, Bitbucket)

#### 2단계: 프로젝트 설정

프로젝트 설정에서 다음을 입력:

- **Framework Preset**: Next.js
- **Root Directory**: `apps/frontend`
- **Build Command**: `cd ../.. && pnpm install && pnpm --filter @side-project/frontend build`
- **Output Directory**: `.next` (자동 감지됨)
- **Install Command**: `cd ../.. && pnpm install`

#### 3단계: 환경 변수 설정

Settings → Environment Variables에서 다음 변수 추가:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

> ⚠️ **주의**: 백엔드가 아직 배포되지 않았다면, 로컬 개발용 URL을 사용하거나 나중에 업데이트하세요.

#### 4단계: 배포

"Deploy" 버튼 클릭

### 방법 2: Vercel CLI 사용

#### 1단계: 로그인

```bash
vercel login
```

#### 2단계: 배포

```bash
# 프리뷰 배포
pnpm deploy:frontend:preview

# 프로덕션 배포
pnpm deploy:frontend
```

또는 직접 실행:

```bash
cd apps/frontend
vercel          # 프리뷰
vercel --prod   # 프로덕션
```

## 🔄 추가 프론트엔드 앱 배포

나중에 `apps/admin`, `apps/marketing` 등의 앱이 추가되면:

1. Vercel 대시보드에서 **새 프로젝트** 생성
2. 같은 Git 저장소 연결
3. Root Directory만 변경:
   - `apps/admin` → Root Directory: `apps/admin`
   - `apps/marketing` → Root Directory: `apps/marketing`
4. 각 프로젝트마다 환경 변수 개별 설정

## 📁 프로젝트 구조

```
side-project/
├── apps/
│   ├── frontend/          # ← Vercel 프로젝트 1
│   ├── admin/             # ← Vercel 프로젝트 2 (추후)
│   └── marketing/         # ← Vercel 프로젝트 3 (추후)
├── packages/
│   ├── shared/            # 공유 패키지
│   └── design-system/     # 디자인 시스템
├── .vercelignore          # Vercel 배포 제외 파일
└── apps/frontend/vercel.json  # 프론트엔드 배포 설정
```

## ⚙️ 설정 파일 설명

### `apps/frontend/vercel.json`

프론트엔드 앱의 Vercel 배포 설정:
- `buildCommand`: 모노레포 루트에서 빌드 실행
- `installCommand`: 워크스페이스 의존성 설치
- `outputDirectory`: Next.js 빌드 출력 디렉토리

### `.vercelignore`

Vercel 배포 시 제외할 파일/디렉토리:
- 백엔드 관련 파일
- 데이터베이스 파일
- 로그 파일
- 개발 도구

## 🌐 도메인 설정

1. Vercel 프로젝트 → Settings → Domains
2. 원하는 도메인 추가:
   - 예: `app.yourdomain.com`
   - 예: `yourdomain.com`

## 🔐 환경 변수 관리

각 Vercel 프로젝트마다 환경 변수를 개별 설정:

### Production 환경 변수

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Preview 환경 변수 (선택사항)

```
NEXT_PUBLIC_API_URL=https://api-dev.yourdomain.com
```

## 🔄 자동 배포

Git 저장소와 연결하면:

- **메인 브랜치 푸시** → 프로덕션 자동 배포
- **다른 브랜치 푸시** → 프리뷰 자동 배포
- **Pull Request** → 프리뷰 자동 배포

## 📊 배포 상태 확인

1. Vercel 대시보드에서 배포 상태 확인
2. 배포 로그 확인
3. 프리뷰 URL로 테스트

## 🐛 문제 해결

### 빌드 실패 시

1. **워크스페이스 의존성 문제**:
   - `installCommand`가 루트에서 실행되는지 확인
   - `pnpm install`이 모든 패키지를 설치하는지 확인

2. **빌드 명령어 문제**:
   - `buildCommand`가 올바른 디렉토리에서 실행되는지 확인
   - Turborepo 필터가 올바른지 확인

3. **환경 변수 문제**:
   - `NEXT_PUBLIC_` 접두사 확인
   - 환경 변수가 올바르게 설정되었는지 확인

### 로그 확인

Vercel 대시보드 → Deployments → 해당 배포 → Build Logs

## 📝 참고사항

- 백엔드는 별도로 배포해야 합니다 (Railway, Render, Fly.io 등)
- 백엔드 CORS 설정에서 Vercel 도메인을 허용해야 합니다
- 프로덕션 환경에서는 PostgreSQL 사용을 권장합니다

## 🔗 관련 문서

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Turborepo 문서](https://turbo.build/repo/docs)


