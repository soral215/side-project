'use client';

import { useNotifications } from '../hooks/useNotifications';
import { useEffect } from 'react';

/**
 * 알림 리스너 컴포넌트
 * 실시간 알림을 수신하고 Toast로 표시합니다.
 * Feature Flag로 제어됩니다.
 */
export const NotificationListener: React.FC = () => {
  const { isConnected } = useNotifications();

  // 개발 모드에서만 연결 상태 표시
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isConnected) {
      console.log('✅ 실시간 알림 시스템 연결됨');
    }
  }, [isConnected]);

  // UI는 렌더링하지 않음 (백그라운드에서 동작)
  return null;
};

