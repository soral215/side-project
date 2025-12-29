'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button } from '@side-project/design-system';

/**
 * 서버 정보 표시 컴포넌트
 * 현재 환경, API URL, 빌드 정보 등을 표시합니다.
 */
export const ServerInfo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    // API URL 가져오기
    const getApiUrl = () => {
      const url = process.env.NEXT_PUBLIC_API_URL || 'https://side-projectbackend-production-1e9c.up.railway.app';
      const cleanUrl = url.replace(/\/$/, '');
      return cleanUrl;
    };

    setApiUrl(getApiUrl());

    // 서버 상태 확인
    const checkServerStatus = async () => {
      try {
        const url = getApiUrl();
        // 백엔드의 /health 엔드포인트 사용
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => null);
        
        // 응답이 있고 성공하면 온라인, 없으면 오프라인
        setServerStatus(response?.ok ? 'online' : 'offline');
      } catch {
        setServerStatus('offline');
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // 30초마다 체크

    return () => clearInterval(interval);
  }, []);

  // 환경 정보
  const environment = process.env.NODE_ENV || 'development';
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';

  // 환경별 색상
  const getEnvironmentColor = () => {
    if (isDevelopment) return 'bg-blue-500';
    if (isProduction) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getEnvironmentLabel = () => {
    if (isDevelopment) return 'Development';
    if (isProduction) return 'Production';
    return 'Staging';
  };

  // 호스트 정보
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const port = typeof window !== 'undefined' ? window.location.port : 'unknown';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[9998] bg-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        title="서버 정보 보기"
        aria-label="서버 정보 보기"
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
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9998] w-80">
      <Card variant="elevated" padding="md" className="shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getEnvironmentColor()}`}></div>
            <h3 className="font-semibold text-gray-900">서버 정보</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="닫기"
            aria-label="닫기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 환경 정보 */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">환경</span>
              <span className={`text-xs px-2 py-1 rounded ${getEnvironmentColor()} text-white`}>
                {getEnvironmentLabel()}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              NODE_ENV: {environment}
            </div>
          </div>

          {/* 서버 상태 */}
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">서버 상태</span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    serverStatus === 'online'
                      ? 'bg-green-500 animate-pulse'
                      : serverStatus === 'offline'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}
                ></div>
                <span className="text-xs text-gray-700">
                  {serverStatus === 'online'
                    ? '온라인'
                    : serverStatus === 'offline'
                    ? '오프라인'
                    : '확인 중...'}
                </span>
              </div>
            </div>
          </div>

          {/* API URL */}
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-600">API URL</span>
            </div>
            <div className="text-xs text-gray-700 break-all font-mono bg-white p-2 rounded border border-gray-200">
              {apiUrl}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(apiUrl);
              }}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              📋 복사
            </button>
          </div>

          {/* 호스트 정보 */}
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-600">호스트</span>
            </div>
            <div className="text-xs text-gray-700 font-mono">
              {hostname}
              {port && `:${port}`}
            </div>
          </div>

          {/* 빌드 정보 */}
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-600">빌드 시간</span>
            </div>
            <div className="text-xs text-gray-700">
              {process.env.NEXT_PUBLIC_BUILD_TIME || 'N/A'}
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => {
                  window.open(apiUrl, '_blank');
                }}
              >
                API 열기
              </Button>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => {
                  window.location.reload();
                }}
              >
                새로고침
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

