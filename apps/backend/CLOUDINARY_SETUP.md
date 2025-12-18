# Cloudinary 설정 가이드

## 1. Cloudinary 계정 생성

1. [Cloudinary 웹사이트](https://cloudinary.com/)에 접속
2. 무료 계정 생성 (Sign up for free)
3. 대시보드에서 다음 정보 확인:
   - Cloud Name
   - API Key
   - API Secret

## 2. 환경 변수 설정

`apps/backend/.env` 파일에 다음 변수를 추가하세요:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 3. 보안 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.env`가 포함되어 있는지 확인하세요
- 프로덕션 환경에서는 환경 변수로 직접 설정하세요

## 4. 무료 티어 제한

- 저장 용량: 25GB
- 월간 대역폭: 25GB
- 이미지 최적화: 자동
- CDN: 포함

## 5. 테스트

환경 변수 설정 후 서버를 재시작하고 프로필 이미지 업로드를 테스트하세요.

