'use client';

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';

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

/**
 * 세션 스토리지에서 Feature Flag 오버라이드를 읽어옵니다.
 * 개발 모드에서만 사용됩니다.
 */
const getSessionOverrides = (): Partial<FeatureFlags> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = sessionStorage.getItem('featureFlagOverrides');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to parse feature flag overrides from sessionStorage:', error);
  }
  
  return {};
};

/**
 * 세션 스토리지에 Feature Flag 오버라이드를 저장합니다.
 */
const saveSessionOverrides = (overrides: Partial<FeatureFlags>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem('featureFlagOverrides', JSON.stringify(overrides));
  } catch (error) {
    console.warn('Failed to save feature flag overrides to sessionStorage:', error);
  }
};

interface FeatureFlagContextType {
  flags: FeatureFlags;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
  toggleFlag: (flag: keyof FeatureFlags) => void;
  resetFlags: () => void;
  resetFlag: (flag: keyof FeatureFlags) => void;
  overrides: Partial<FeatureFlags>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

/**
 * Feature Flag Provider
 * 환경 변수 기반으로 Feature Flag를 제공하며, 세션 스토리지 오버라이드를 지원합니다.
 */
export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultFlags = useMemo(() => getDefaultFlags(), []);
  const [overrides, setOverrides] = useState<Partial<FeatureFlags>>(() => getSessionOverrides());

  // 세션 스토리지 변경 감지 (다른 탭에서 변경된 경우)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'featureFlagOverrides') {
        setOverrides(getSessionOverrides());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 최종 플래그 = 기본값 + 오버라이드
  const flags = useMemo(() => {
    return { ...defaultFlags, ...overrides };
  }, [defaultFlags, overrides]);

  const isEnabled = useCallback(
    (flag: keyof FeatureFlags): boolean => {
      return flags[flag] ?? false;
    },
    [flags]
  );

  const toggleFlag = useCallback((flag: keyof FeatureFlags) => {
    setOverrides((prev) => {
      // 현재 최종 값 (기본값 + 오버라이드)
      const currentValue = prev[flag] ?? defaultFlags[flag];
      // 반전된 값으로 오버라이드 설정
      const newOverrides = {
        ...prev,
        [flag]: !currentValue,
      };
      saveSessionOverrides(newOverrides);
      return newOverrides;
    });
  }, [defaultFlags]);

  const resetFlag = useCallback((flag: keyof FeatureFlags) => {
    setOverrides((prev) => {
      const newOverrides = { ...prev };
      delete newOverrides[flag];
      saveSessionOverrides(newOverrides);
      return newOverrides;
    });
  }, []);

  const resetFlags = useCallback(() => {
    setOverrides({});
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('featureFlagOverrides');
    }
  }, []);

  return (
    <FeatureFlagContext.Provider
      value={{
        flags,
        isEnabled,
        toggleFlag,
        resetFlags,
        resetFlag,
        overrides,
      }}
    >
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

