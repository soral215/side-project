# Frontend

Next.js 14를 사용한 프론트엔드 애플리케이션입니다.

## 실행

```bash
pnpm dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 환경 변수

`.env.local` 파일을 생성하고 다음을 추가하세요:

```bash
# API 설정
NEXT_PUBLIC_API_URL=http://localhost:3001

# Feature Flags (선택사항)
# 새 대시보드 UI (실험적)
NEXT_PUBLIC_FEATURE_NEW_DASHBOARD=false

# 고급 검색 기능
NEXT_PUBLIC_FEATURE_ADVANCED_SEARCH=false

# 다크 모드
NEXT_PUBLIC_FEATURE_DARK_MODE=false

# 실시간 알림
NEXT_PUBLIC_FEATURE_REALTIME_NOTIFICATIONS=false
```

### Feature Flags 사용법

Feature Flag를 사용하여 기능을 점진적으로 활성화할 수 있습니다:

```tsx
import { useFeatureFlag } from '../src/contexts/FeatureFlagContext';

function MyComponent() {
  const { isEnabled } = useFeatureFlag();
  
  if (isEnabled('newDashboard')) {
    return <NewDashboard />;
  }
  return <OldDashboard />;
}
```

또는 간단한 체크:

```tsx
import { useIsFeatureEnabled } from '../src/contexts/FeatureFlagContext';

function MyComponent() {
  const showNewFeature = useIsFeatureEnabled('newDashboard');
  
  return (
    <>
      {showNewFeature && <NewFeature />}
    </>
  );
}
```
