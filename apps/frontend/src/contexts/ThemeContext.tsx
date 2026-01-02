'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useFeatureFlag } from './FeatureFlagContext';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme-preference';

// 시스템 테마 감지 함수 (컴포넌트 외부로 이동)
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isEnabled } = useFeatureFlag();
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'system';
    }
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return stored || 'system';
  });

  // hydration 에러 방지: 서버와 클라이언트 모두에서 동일한 초기값 사용
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    // 서버와 클라이언트 모두에서 'light'로 시작하여 hydration 일치 보장
    // 실제 테마는 useEffect에서 계산하여 적용
    return 'light';
  });

  // 실제 적용될 테마 계산
  const calculateResolvedTheme = useCallback((currentTheme: Theme): 'light' | 'dark' => {
    if (currentTheme === 'system') {
      return getSystemTheme();
    }
    return currentTheme;
  }, []);

  // Feature Flag 체크 및 테마 적용 (클라이언트에서만 실행)
  useEffect(() => {
    const darkModeEnabled = isEnabled('darkMode');
    
    if (!darkModeEnabled) {
      // Feature Flag가 비활성화되어 있으면 라이트 모드로 강제
      setResolvedTheme('light');
      document.documentElement.classList.remove('dark');
      return;
    }

    const resolved = calculateResolvedTheme(theme);
    setResolvedTheme(resolved);

    // HTML 클래스 토글
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, isEnabled, calculateResolvedTheme]);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (isEnabled('darkMode')) {
        setResolvedTheme(e.matches ? 'dark' : 'light');
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, isEnabled]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      // system 모드일 때는 현재 시스템 테마의 반대로 설정
      const current = getSystemTheme();
      setTheme(current === 'dark' ? 'light' : 'dark');
    }
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

