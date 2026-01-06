'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@side-project/design-system';
import { useModel3DJobStore } from '../stores/model3dJobStore';

const statusLabel: Record<string, string> = {
  PENDING: '대기',
  PROCESSING: '생성 중',
  SUCCEEDED: '완료',
  FAILED: '실패',
};

export const Model3DJobStatusWidget = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const jobs = useModel3DJobStore((s) => s.jobs);
  const clearFinished = useModel3DJobStore((s) => s.clearFinished);

  const list = useMemo(() => {
    return Object.values(jobs).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [jobs]);

  const processingCount = useMemo(() => list.filter((j) => j.status === 'PROCESSING' || j.status === 'PENDING').length, [list]);
  const latest = list[0];

  if (list.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[10000] w-[340px]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg px-4 py-3 flex items-center justify-between"
          title="3D 생성 상태 보기"
        >
          <div className="text-left">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">3D 생성 상태</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {processingCount > 0 ? `${processingCount}개 작업 진행 중` : `최근 작업: ${statusLabel[latest.status] || latest.status}`}
            </div>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">열기</div>
        </button>
      ) : (
        <Card variant="elevated" padding="md" className="dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">3D 생성 상태</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {processingCount > 0 ? `${processingCount}개 작업 진행 중` : '진행 중인 작업 없음'}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="닫기"
            >
              ✕
            </button>
          </div>

          <div className="max-h-[220px] overflow-auto space-y-2">
            {list.slice(0, 6).map((j) => (
              <div
                key={j.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">ID</div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {statusLabel[j.status] || j.status}
                  </div>
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-400 break-all mt-1">{j.id}</div>
                {j.status === 'FAILED' && j.errorMessage && (
                  <div className="text-[11px] text-red-600 dark:text-red-400 mt-2 break-all">
                    {j.errorMessage}
                  </div>
                )}
                {j.status === 'SUCCEEDED' && j.outputModelUrl && (
                  <div className="text-[11px] text-green-700 dark:text-green-400 mt-2 break-all">
                    완료됨
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                clearFinished();
              }}
              fullWidth
            >
              완료/실패 정리
            </Button>
            <Button
              size="sm"
              onClick={() => {
                router.push('/model3d');
              }}
              fullWidth
            >
              2D→3D 페이지
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};


