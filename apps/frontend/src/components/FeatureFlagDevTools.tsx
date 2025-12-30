'use client';

import React, { useState, useEffect } from 'react';
import { useFeatureFlag, type FeatureFlags } from '../contexts/FeatureFlagContext';
import { Button, Card, Toggle } from '@side-project/design-system';

/**
 * Feature Flag 개발자 도구
 * 개발 모드에서만 표시되며, Feature Flag를 실시간으로 토글할 수 있습니다.
 */
export const FeatureFlagDevTools: React.FC = () => {
  const { flags, isEnabled, toggleFlag, resetFlags, resetFlag, overrides } = useFeatureFlag();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);

  // 기본값 계산 (환경 변수에서)
  const defaultFlags: FeatureFlags = {
    newDashboard: process.env.NEXT_PUBLIC_FEATURE_NEW_DASHBOARD === 'true',
    advancedSearch: process.env.NEXT_PUBLIC_FEATURE_ADVANCED_SEARCH === 'true',
    aiSearch: process.env.NEXT_PUBLIC_FEATURE_AI_SEARCH === 'true',
    darkMode: process.env.NEXT_PUBLIC_FEATURE_DARK_MODE === 'true',
    realtimeNotifications: process.env.NEXT_PUBLIC_FEATURE_REALTIME_NOTIFICATIONS === 'true',
    aiChatbot: process.env.NEXT_PUBLIC_FEATURE_AI_CHATBOT === 'true',
  };

  // 개발 모드 체크는 클라이언트 사이드에서만 수행
  useEffect(() => {
    const checkDevelopment = () => {
      if (process.env.NODE_ENV === 'development') {
        setIsDevelopment(true);
        return;
      }
      // 클라이언트 사이드에서만 window.location 접근
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        setIsDevelopment(true);
      }
    };
    checkDevelopment();
  }, []);
  
  if (!isDevelopment) {
    return null;
  }

  const flagLabels: Record<keyof FeatureFlags, string> = {
    newDashboard: '새 대시보드',
    advancedSearch: '고급 검색',
    aiSearch: 'AI 스마트 검색',
    darkMode: '다크 모드',
    realtimeNotifications: '실시간 알림',
    aiChatbot: 'AI 챗봇',
  };

  const flagDescriptions: Record<keyof FeatureFlags, string> = {
    newDashboard: '실험적인 새 대시보드 UI',
    advancedSearch: '고급 검색 및 필터 기능',
    aiSearch: 'OpenAI 기반 자연어 검색',
    darkMode: '다크 모드 테마',
    realtimeNotifications: '실시간 알림 기능',
    aiChatbot: 'OpenAI 기반 AI 챗봇',
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Feature Flag 개발자 도구 열기"
        aria-label="Feature Flag 개발자 도구 열기"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] transition-all duration-300 ${
        isMinimized ? 'w-80' : 'w-96'
      }`}
    >
      <Card variant="elevated" padding="md" className="shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Feature Flags</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              Dev Mode
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              title={isMinimized ? '확장' : '최소화'}
              aria-label={isMinimized ? '확장' : '최소화'}
            >
              {isMinimized ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              title="닫기"
              aria-label="닫기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* 플래그 목록 */}
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {(Object.keys(flags) as Array<keyof FeatureFlags>).map((flag) => {
                const enabled = isEnabled(flag);
                const isOverridden = flag in overrides;

                return (
                  <div
                    key={flag}
                    className={`p-3 rounded-lg border ${
                      isOverridden
                        ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {flagLabels[flag]}
                          </span>
                          {isOverridden && (
                            <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-1.5 py-0.5 rounded">
                              오버라이드
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {flagDescriptions[flag]}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            기본값: {defaultFlags[flag] ? 'ON' : 'OFF'}
                          </span>
                          {isOverridden && (
                            <span className="text-xs text-purple-600 dark:text-purple-400">
                              → 현재: {enabled ? 'ON' : 'OFF'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Toggle
                          checked={enabled}
                          onChange={() => toggleFlag(flag)}
                          aria-label={`${flagLabels[flag]} ${enabled ? '비활성화' : '활성화'}`}
                          size="md"
                        />
                        {isOverridden && (
                          <button
                            onClick={() => resetFlag(flag)}
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            title="오버라이드 초기화"
                            aria-label="오버라이드 초기화"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 액션 버튼 */}
            {Object.keys(overrides).length > 0 && (
              <div className="pt-3 border-t border-gray-200">
                <Button
                  onClick={resetFlags}
                  variant="secondary"
                  size="sm"
                  fullWidth
                >
                  모든 오버라이드 초기화
                </Button>
              </div>
            )}

            {/* 정보 */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 세션 스토리지에 저장되며, 새로고침 시 유지됩니다.
                <br />
                다른 탭에서도 변경사항이 동기화됩니다.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

