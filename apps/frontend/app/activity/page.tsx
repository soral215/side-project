'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../src/stores/authStore';
import { useActivityLogs, useActivityStats, type ActivityLog } from '../../src/hooks/useActivityLogs';
import { Button, Input, Card, Modal, Skeleton, SkeletonText } from '@side-project/design-system';
import { ThemeToggle } from '../../src/components/ThemeToggle';

const ACTION_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'user_login', label: '로그인' },
  { value: 'user_register', label: '회원가입' },
  { value: 'user_update', label: '사용자 수정' },
  { value: 'user_delete', label: '사용자 삭제' },
  { value: 'profile_update', label: '프로필 업데이트' },
  { value: 'password_change', label: '비밀번호 변경' },
  { value: 'account_delete', label: '계정 삭제' },
];

const ENTITY_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'user', label: '사용자' },
];

export default function ActivityPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    startDate: '',
    endDate: '',
  });
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // React Query hooks
  const { data: logsData, isLoading, error } = useActivityLogs({
    page: currentPage,
    limit,
    ...(filters.action && { action: filters.action }),
    ...(filters.entity && { entity: filters.entity }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate }),
  });

  const { data: statsData } = useActivityStats(filters.startDate || undefined, filters.endDate || undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      action: '',
      entity: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    const option = ACTION_OPTIONS.find((opt) => opt.value === action);
    return option?.label || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('login') || action.includes('register')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (action.includes('update')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (action.includes('delete')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  if (!mounted || !isAuthenticated) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Skeleton variant="circular" width={48} height={48} className="mx-auto mb-4" />
          <SkeletonText lines={2} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">활동 로그</h1>
            <p className="text-gray-600 dark:text-gray-400">시스템 내 모든 사용자 활동을 확인할 수 있습니다</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.name} ({user.email})
              </span>
            )}
            <Button onClick={() => router.push('/')} variant="secondary" size="sm">
              홈으로
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

        {/* 통계 카드 */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card variant="elevated" padding="md">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">총 활동 수</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statsData.total.toLocaleString()}</div>
            </Card>
            <Card variant="elevated" padding="md">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">액션 종류</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statsData.actionStats.length}</div>
            </Card>
            <Card variant="elevated" padding="md">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">엔티티 종류</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statsData.entityStats.length}</div>
            </Card>
            <Card variant="elevated" padding="md">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">오늘 활동</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statsData.weekTrend[statsData.weekTrend.length - 1]?.count || 0}
              </div>
            </Card>
          </div>
        )}

        {/* 필터 섹션 */}
        <Card variant="elevated" padding="md" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">액션</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">엔티티</label>
              <select
                value={filters.entity}
                onChange={(e) => handleFilterChange('entity', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {ENTITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">시작 날짜</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">종료 날짜</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleResetFilters} variant="secondary" size="sm" className="w-full">
                필터 초기화
              </Button>
            </div>
          </div>
        </Card>

        {/* 로그 목록 */}
        <Card variant="elevated" padding="none">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8">
                <SkeletonText lines={5} />
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600 dark:text-red-400">
                활동 로그를 불러오는데 실패했습니다.
              </div>
            ) : !logsData?.data || logsData.data.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                활동 로그가 없습니다.
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        시간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        사용자 ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        액션
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        엔티티
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        IP 주소
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {logsData.data.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {log.userId || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(
                              log.action
                            )}`}
                          >
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {log.entity || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {log.ipAddress || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            onClick={() => setSelectedLog(log)}
                            variant="secondary"
                            size="sm"
                          >
                            상세보기
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 페이징 */}
                {logsData.pagination && logsData.pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      총 {logsData.pagination.total}개 중{' '}
                      {(logsData.pagination.page - 1) * logsData.pagination.limit + 1}-
                      {Math.min(logsData.pagination.page * logsData.pagination.limit, logsData.pagination.total)}개
                      표시
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={logsData.pagination.page === 1}
                        variant="secondary"
                        size="sm"
                      >
                        이전
                      </Button>
                      <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {logsData.pagination.page} / {logsData.pagination.totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage((prev) => Math.min(logsData.pagination.totalPages, prev + 1))}
                        disabled={logsData.pagination.page === logsData.pagination.totalPages}
                        variant="secondary"
                        size="sm"
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>

      {/* 상세 정보 모달 */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="활동 로그 상세 정보"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{selectedLog.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">시간</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(selectedLog.createdAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">사용자 ID</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{selectedLog.userId || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">액션</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{getActionLabel(selectedLog.action)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">엔티티</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{selectedLog.entity || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">엔티티 ID</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{selectedLog.entityId || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP 주소</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{selectedLog.ipAddress || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Agent</label>
              <p className="text-sm text-gray-900 dark:text-gray-100 break-all">{selectedLog.userAgent || '-'}</p>
            </div>
            {selectedLog.details != null && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">상세 정보</label>
                <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-auto max-h-64">
                  {typeof selectedLog.details === 'string'
                    ? selectedLog.details
                    : JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
}

