'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUsers, useUpdateUser, useDeleteUser } from '../src/hooks/useUsers';
import { useAuthStore } from '../src/stores/authStore';
import { useServerStatus } from '../src/hooks/useServerStatus';
import { updateUserSchema, ZodError } from '@side-project/shared';
import { useToast } from '../src/contexts/ToastContext';
import { useFeatureFlag } from '../src/contexts/FeatureFlagContext';
import { Button, Input, Card, Modal, SkeletonCard, Skeleton, SkeletonText } from '@side-project/design-system';
import { ThemeToggle } from '../src/components/ThemeToggle';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editErrors, setEditErrors] = useState<{ name?: string; email?: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [triggerError, setTriggerError] = useState(false);
  const [useAiSearch, setUseAiSearch] = useState(false);

  // React Query hooks
  const { data: usersData, isLoading, error } = useUsers(currentPage, 10, search, useAiSearch && isEnabled('aiSearch'));
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const { data: isServerOnline = false } = useServerStatus();
  const { showError, showSuccess, showInfo } = useToast();
  const { isEnabled } = useFeatureFlag();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    if (value && usersData && usersData.data.length > 0) {
      showInfo(`${usersData.data.length}개의 검색 결과를 찾았습니다.`);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const handleEditClick = (user: { id: string; name: string; email: string }) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditErrors({});
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditErrors({});

    try {
      const validatedData = updateUserSchema.parse({
        name: editName !== editingUser.name ? editName : undefined,
        email: editEmail !== editingUser.email ? editEmail : undefined,
      });

      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        data: validatedData,
      });

      setEditingUser(null);
      setEditName('');
      setEditEmail('');
      setEditErrors({});
      showSuccess('사용자 정보가 수정되었습니다.');
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setEditErrors(fieldErrors);
      } else {
        showError(error instanceof Error ? error.message : '사용자 수정에 실패했습니다.');
      }
    }
  };

  const handleDeleteClick = (userId: string) => {
    setDeleteConfirm(userId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteUserMutation.mutateAsync(deleteConfirm);
      setDeleteConfirm(null);
      showSuccess('사용자가 삭제되었습니다.');
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : '사용자 삭제에 실패했습니다.');
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Skeleton variant="circular" width={48} height={48} className="mx-auto mb-4" />
          <SkeletonText lines={2} />
        </div>
      </main>
    );
  }

  const serverStatus = isServerOnline ? 'online' : 'offline';

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                모노레포 사이드 프로젝트
              </h1>
              {isEnabled('newDashboard') && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  💡 <a href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">새 대시보드</a>를 사용해보세요
                </p>
              )}
            </div>
            {/* 서버 상태 표시 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  serverStatus === 'online'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
                title={serverStatus === 'online' ? '서버 정상 작동 중' : '서버 연결 실패'}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {serverStatus === 'online' ? '서버 정상' : '서버 오프라인'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.name} ({user.email})
              </span>
            )}
            {process.env.NODE_ENV === 'development' && (
              <Button
                onClick={() => setTriggerError(true)}
                variant="warning"
                size="sm"
                title="Error Boundary 테스트 (개발 모드만 표시)"
              >
                🧪 에러 테스트
              </Button>
            )}
            <Button
              onClick={() => router.push('/profile')}
              variant="secondary"
              size="sm"
            >
              프로필
            </Button>
            <Button
              onClick={handleLogout}
              variant="danger"
              size="sm"
            >
              로그아웃
            </Button>
          </div>
        </div>

        {/* Error Boundary 테스트 (개발 모드만) */}
        {triggerError && (
          <div>
            {/* 이 컴포넌트는 렌더링 시 에러를 발생시킵니다 */}
            {(() => {
              throw new Error('🧪 Error Boundary 테스트: 의도적으로 발생시킨 에러입니다!');
            })()}
          </div>
        )}

        {/* 사용자 목록 */}
        <Card variant="default" padding="md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              사용자 목록
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder={
                    useAiSearch && isEnabled('aiSearch')
                      ? 'AI 검색: "이번 주에 가입한 사용자", "gmail 사용자" 등'
                      : isEnabled('advancedSearch')
                      ? '고급 검색 (이름, 이메일, 역할 등)'
                      : '검색 (이름 또는 이메일)'
                  }
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="text-sm pr-10"
                />
                {isEnabled('aiSearch') && (
                  <button
                    onClick={() => setUseAiSearch(!useAiSearch)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors ${
                      useAiSearch
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    title={useAiSearch ? 'AI 검색 활성화됨 - 클릭하여 일반 검색으로 전환' : 'AI 검색 활성화 - 클릭하여 자연어 검색 사용'}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {isEnabled('advancedSearch') && (
                <Button variant="secondary" size="sm">
                  필터
                </Button>
              )}
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCard
                  key={index}
                  showAvatar={false}
                  showTitle={true}
                  showText={true}
                  showButton={true}
                />
              ))}
            </div>
          ) : error ? (
            <p className="text-red-600 dark:text-red-400">에러: {error instanceof Error ? error.message : '알 수 없는 오류'}</p>
          ) : !usersData || usersData.data.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">사용자가 없습니다.</p>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {usersData.data.map((user: { id: string; name: string; email: string; createdAt: string }) => (
                  <div
                    key={user.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          생성일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleEditClick(user)}
                          variant="primary"
                          size="sm"
                        >
                          수정
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(user.id)}
                          variant="danger"
                          size="sm"
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* 페이지네이션 */}
              {usersData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    총 {usersData.pagination.total}명 중{' '}
                    {(currentPage - 1) * usersData.pagination.limit + 1}-
                    {Math.min(currentPage * usersData.pagination.limit, usersData.pagination.total)}명 표시
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      variant="secondary"
                      size="sm"
                    >
                      이전
                    </Button>
                    {Array.from({ length: Math.min(5, usersData.pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (usersData.pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= usersData.pagination.totalPages - 2) {
                        pageNum = usersData.pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          variant={currentPage === pageNum ? 'primary' : 'secondary'}
                          size="sm"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      onClick={() => setCurrentPage(Math.min(usersData.pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === usersData.pagination.totalPages}
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
        </Card>
      </div>

      {/* 수정 모달 */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => {
          setEditingUser(null);
          setEditName('');
          setEditEmail('');
          setEditErrors({});
        }}
        title="사용자 수정"
        size="md"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <Input
            type="text"
            label="이름"
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value);
              if (editErrors.name) setEditErrors({ ...editErrors, name: undefined });
            }}
            error={editErrors.name}
            fullWidth
          />
          <Input
            type="email"
            label="이메일"
            value={editEmail}
            onChange={(e) => {
              setEditEmail(e.target.value);
              if (editErrors.email) setEditErrors({ ...editErrors, email: undefined });
            }}
            error={editErrors.email}
            fullWidth
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              onClick={() => {
                setEditingUser(null);
                setEditName('');
                setEditEmail('');
                setEditErrors({});
              }}
              variant="secondary"
            >
              취소
            </Button>
            <Button
              type="submit"
              isLoading={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 삭제 확인 다이얼로그 */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="사용자 삭제"
        size="md"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => setDeleteConfirm(null)}
            variant="secondary"
          >
            취소
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            isLoading={deleteUserMutation.isPending}
            variant="danger"
          >
            {deleteUserMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </div>
      </Modal>
    </main>
  );
}
