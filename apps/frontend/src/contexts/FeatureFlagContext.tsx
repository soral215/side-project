'use client';

import React, { createContext, useContext, useMemo } from 'react';

/**
 * Feature Flag 타입 정의
 * 새로운 기능 플래그를 추가할 때 여기에 타입을 추가하세요.
 */
export interface FeatureFlags {
  /** 새 대시보드 UI (실험적) */
  newDashboard: boolean;
  /** 고급 검색 기능 */
  advancedSearch: boolean;
  /** 다크 모드 */
  darkMode: boolean;
  /** 실시간 알림 */
  realtimeNotifications: boolean;
}

/**
 * 환경 변수에서 Feature Flag 기본값을 읽어옵니다.
 * NEXT_PUBLIC_ 접두사가 붙은 환경 변수만 클라이언트에서 접근 가능합니다.
 */
const getDefaultFlags = (): FeatureFlags => {
  return {
    newDashboard: process.env.NEXT_PUBLIC_FEATURE_NEW_DASHBOARD === 'true',
    advancedSearch: process.env.NEXT_PUBLIC_FEATURE_ADVANCED_SEARCH === 'true',
    darkMode: process.env.NEXT_PUBLIC_FEATURE_DARK_MODE === 'true',
    realtimeNotifications: process.env.NEXT_PUBLIC_FEATURE_REALTIME_NOTIFICATIONS === 'true',
  };
};

interface FeatureFlagContextType {
  flags: FeatureFlags;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

/**
 * Feature Flag Provider
 * 환경 변수 기반으로 Feature Flag를 제공합니다.
 */
export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const flags = useMemo(() => getDefaultFlags(), []);

  const isEnabled = React.useCallback(
    (flag: keyof FeatureFlags): boolean => {
      return flags[flag] ?? false;
    },
    [flags]
  );

  return (
    <FeatureFlagContext.Provider value={{ flags, isEnabled }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

/**
 * Feature Flag를 사용하는 훅
 * 
 * @example
 * ```tsx
 * const { isEnabled } = useFeatureFlag();
 * 
 * if (isEnabled('newDashboard')) {
 *   return <NewDashboard />;
 * }
 * return <OldDashboard />;
 * ```
 */
export const useFeatureFlag = (): FeatureFlagContextType => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
  }
  return context;
};

/**
 * 특정 Feature Flag가 활성화되어 있는지 확인하는 훅
 * 
 * @example
 * ```tsx
 * const isNewDashboardEnabled = useIsFeatureEnabled('newDashboard');
 * ```
 */
export const useIsFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  const { isEnabled } = useFeatureFlag();
  return isEnabled(flag);
};

