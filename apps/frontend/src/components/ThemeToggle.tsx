'use client';

import { useTheme } from '../contexts/ThemeContext';
import { useFeatureFlag } from '../contexts/FeatureFlagContext';
import { Button } from '@side-project/design-system';

export const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();
  const { isEnabled } = useFeatureFlag();

  if (!isEnabled('darkMode')) {
    return null; // Feature Flag가 비활성화되어 있으면 표시하지 않음
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={toggleTheme}
        variant="secondary"
        size="sm"
        className="relative"
        aria-label={`테마를 ${resolvedTheme === 'dark' ? '라이트' : '다크'} 모드로 전환`}
      >
        {resolvedTheme === 'dark' ? (
          // 라이트 모드 아이콘 (태양)
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          // 다크 모드 아이콘 (달)
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </Button>

      {/* 고급 옵션: 시스템/라이트/다크 선택 */}
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
        className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="테마 선택"
      >
        <option value="light">라이트</option>
        <option value="dark">다크</option>
        <option value="system">시스템</option>
      </select>
    </div>
  );
};

