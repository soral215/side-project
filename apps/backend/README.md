# Backend

Express + TypeScript + Prisma를 사용한 백엔드 API 서버입니다.

## 기술 스택

- **Express**: 웹 프레임워크
- **TypeScript**: 타입 안전성
- **Prisma**: ORM (Object-Relational Mapping)
- **SQLite**: 데이터베이스 (개발 환경)

## 실행

```bash
pnpm dev
```

http://localhost:3001 에서 확인할 수 있습니다.

## 환경 변수

`.env` 파일을 생성하고 다음을 추가하세요:

```
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV=development
```

## 2D → 3D 변환(상용 API 연동)

현재 프로젝트는 `/api/3d/jobs`로 업로드한 이미지를 3D 모델로 변환하는 Job을 생성합니다.

- 기본값은 **mock**(데모용)이며, 환경 변수로 **Meshy(상용)** 또는 Replicate로 전환할 수 있습니다.

### Meshy(상용) 사용

```
MODEL3D_PROVIDER=meshy
MESHY_API_KEY="YOUR_API_KEY"

# (선택) Meshy API 설정 - 문서/플랜에 따라 다를 수 있어 조절 가능
MESHY_API_BASE="https://api.meshy.ai"
MESHY_CREATE_PATH="/openapi/v1/image-to-3d"
MESHY_STATUS_PATH_TEMPLATE="/openapi/v1/image-to-3d/{id}"
MESHY_IMAGE_FIELD="image_url"
MESHY_MULTI_CREATE_PATH="/openapi/v1/multi-image-to-3d"
MESHY_MULTI_STATUS_PATH_TEMPLATE="/openapi/v1/multi-image-to-3d/{id}"
MESHY_MULTI_IMAGE_FIELD="image_urls"
MESHY_RESULT_URL_FIELDS="model_urls.glb,model_urls.pre_remeshed_glb,model_urls.obj,model_urls.fbx,glb_url,gltf_url,model_url,output.glb,output.gltf"

# (선택) 타임아웃/폴링
MODEL3D_TIMEOUT_MS=300000
MODEL3D_POLL_INTERVAL_MS=2000
```

> Meshy의 실제 엔드포인트/필드명은 계정 플랜/문서에 따라 다를 수 있습니다.  
> Meshy 대시보드의 API 예시(curl)에서 **작업 생성 URL**, **상태 조회 URL**, **결과(GLB) URL 필드**를 확인한 뒤 위 값을 맞춰주세요.

## 데이터베이스 관리

### Prisma Studio (데이터베이스 GUI)

데이터베이스 내용을 시각적으로 확인하고 편집할 수 있습니다:

```bash
npx prisma studio
```

브라우저에서 http://localhost:5555 가 자동으로 열립니다.

### 마이그레이션

스키마를 변경한 후:

```bash
# 개발 환경에서 마이그레이션 생성 및 적용
npx prisma migrate dev

# 마이그레이션 이름 지정
npx prisma migrate dev --name add_new_field
```

### Prisma Client 재생성

스키마를 변경한 후 Prisma Client를 재생성:

```bash
npx prisma generate
```

## API 엔드포인트

### Health Check
- `GET /health` - 서버 상태 확인

### Users
- `GET /api/users` - 모든 사용자 조회
- `GET /api/users/:id` - 특정 사용자 조회
- `POST /api/users` - 사용자 생성
- `PUT /api/users/:id` - 사용자 업데이트
- `DELETE /api/users/:id` - 사용자 삭제

## 데이터베이스 확인 방법

### 1. API로 확인
```bash
curl http://localhost:3001/api/users
```

### 2. Prisma Studio 사용
```bash
npx prisma studio
```

### 3. SQLite 직접 확인
```bash
sqlite3 prisma/dev.db
.tables
SELECT * FROM users;
```

## PostgreSQL로 전환하기

개발 환경에서 PostgreSQL을 사용하려면:

1. PostgreSQL 설치 및 데이터베이스 생성
2. `.env` 파일 수정:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   ```
3. `prisma/schema.prisma` 수정:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. 마이그레이션 재실행:
   ```bash
   npx prisma migrate dev
   ```
