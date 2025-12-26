'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../src/stores/authStore';
import { useFeatureFlag } from '../../src/contexts/FeatureFlagContext';
import { Card, Button } from '@side-project/design-system';

/**
 * 새 대시보드 페이지 (Feature Flag로 제어)
 * NEXT_PUBLIC_FEATURE_NEW_DASHBOARD=true로 활성화
 */
export default function NewDashboardPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { isEnabled } = useFeatureFlag();

  // Feature Flag 체크
  if (!isEnabled('newDashboard')) {
    // 플래그가 비활성화되어 있으면 홈으로 리다이렉트
    router.push('/');
    return null;
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">새 대시보드</h1>
            <p className="text-gray-600">실험적인 새 대시보드 UI입니다</p>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">
                {user.name} ({user.email})
              </span>
            )}
            <Button
              onClick={() => router.push('/profile')}
              variant="secondary"
              size="sm"
            >
              프로필
            </Button>
            <Button
              onClick={() => {
                clearAuth();
                router.push('/login');
              }}
              variant="danger"
              size="sm"
            >
              로그아웃
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-semibold mb-4">통계</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">총 사용자</span>
                <span className="font-bold">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">활성 사용자</span>
                <span className="font-bold">892</span>
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-semibold mb-4">최근 활동</h2>
            <p className="text-gray-600 text-sm">최근 활동 내역이 여기에 표시됩니다.</p>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-semibold mb-4">빠른 액션</h2>
            <div className="space-y-2">
              <Button variant="primary" size="sm" fullWidth>
                새 사용자 추가
              </Button>
              <Button variant="secondary" size="sm" fullWidth>
                리포트 생성
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">기존 대시보드로 돌아가기</h3>
                <p className="text-sm text-gray-600">
                  이 실험적 기능을 비활성화하고 기존 대시보드를 사용하세요.
                </p>
              </div>
              <Button
                onClick={() => router.push('/')}
                variant="secondary"
              >
                기존 대시보드
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

