'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type User, type ApiResponse, type PaginatedResponse, updateUserSchema, ZodError } from '@side-project/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editErrors, setEditErrors] = useState<{ name?: string; email?: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 인증 확인 및 데이터 로드
  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchUsers();
    } else {
      setIsAuthenticated(false);
      router.push('/login');
    }
  }, [mounted, router]);

  // 페이지/검색 변경 시 데이터 다시 로드
  useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchUsers();
    }
  }, [mounted, isAuthenticated, currentPage, search]);

  // 헬스체크 주기적 확인
  useEffect(() => {
    if (!mounted) return;

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3초 타임아웃

        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        setServerStatus('offline');
      }
    };

    // 초기 체크
    checkHealth();

    // 30초마다 체크
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, [mounted]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(search && { search }),
      });
      const response = await fetch(`${API_URL}/api/users?${params}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data: ApiResponse<PaginatedResponse<User>> = await response.json();
      if (data.success && data.data) {
        setUsers(data.data.data);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleEditClick = (user: User) => {
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

      const optimisticUsers = users.map((u) =>
        u.id === editingUser.id
          ? { ...u, name: editName, email: editEmail, updatedAt: new Date().toISOString() }
          : u
      );
      setUsers(optimisticUsers);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(validatedData),
      });

      const data: ApiResponse<User> = await response.json();

      if (data.success && data.data) {
        setEditingUser(null);
        setEditName('');
        setEditEmail('');
        setEditErrors({});
        setUsers(users.map((u) => (u.id === data.data!.id ? data.data! : u)));
        fetchUsers();
      } else if (data.error) {
        setUsers(users);
        if (data.error.code === 'VALIDATION_ERROR' && 'details' in data.error) {
          const fieldErrors: { [key: string]: string } = {};
          const details = (data.error as any).details as Array<{ field: string; message: string }>;
          details.forEach((detail) => {
            fieldErrors[detail.field] = detail.message;
          });
          setEditErrors(fieldErrors);
        } else {
          alert(data.error.message);
        }
      }
    } catch (error) {
      setUsers(users);
      if (error instanceof ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setEditErrors(fieldErrors);
      } else {
        console.error('Failed to update user:', error);
        alert('사용자 수정에 실패했습니다.');
      }
    }
  };

  const handleDeleteClick = (userId: string) => {
    setDeleteConfirm(userId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    const userToDelete = users.find((u) => u.id === deleteConfirm);
    if (!userToDelete) return;

    const optimisticUsers = users.filter((u) => u.id !== deleteConfirm);
    setUsers(optimisticUsers);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/${deleteConfirm}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data: ApiResponse<{ message: string }> = await response.json();

      if (!data.success) {
        setUsers(users);
        alert(data.error?.message || '사용자 삭제에 실패했습니다.');
      } else {
        fetchUsers();
      }
    } catch (error) {
      setUsers(users);
      console.error('Failed to delete user:', error);
      alert('사용자 삭제에 실패했습니다.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // 초기 렌더링 시 항상 로딩 화면 표시
  if (!mounted || !isAuthenticated || loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </main>
    );
  }

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">
              모노레포 사이드 프로젝트
            </h1>
            {/* 서버 상태 표시 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  serverStatus === 'online'
                    ? 'bg-green-500'
                    : serverStatus === 'offline'
                    ? 'bg-red-500'
                    : 'bg-yellow-500 animate-pulse'
                }`}
                title={
                  serverStatus === 'online'
                    ? '서버 정상 작동 중'
                    : serverStatus === 'offline'
                    ? '서버 연결 실패'
                    : '서버 상태 확인 중'
                }
              />
              <span className="text-xs text-gray-500">
                {serverStatus === 'online'
                  ? '서버 정상'
                  : serverStatus === 'offline'
                  ? '서버 오프라인'
                  : '확인 중...'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentUser.name && (
              <span className="text-sm text-gray-600">
                {currentUser.name} ({currentUser.email})
              </span>
            )}
            <button
              onClick={() => router.push('/profile')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              프로필
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              사용자 목록
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="검색 (이름 또는 이메일)"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          {loading ? (
            <p className="text-gray-600">로딩 중...</p>
          ) : users.length === 0 ? (
            <p className="text-gray-600">사용자가 없습니다.</p>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          생성일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* 페이지네이션 */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600">
                    총 {pagination.total}명 중 {((currentPage - 1) * pagination.limit) + 1}-
                    {Math.min(currentPage * pagination.limit, pagination.total)}명 표시
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm border rounded ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 수정 모달 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              사용자 수정
            </h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (editErrors.name) setEditErrors({ ...editErrors, name: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    editErrors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {editErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => {
                    setEditEmail(e.target.value);
                    if (editErrors.email) setEditErrors({ ...editErrors, email: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    editErrors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {editErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.email}</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setEditName('');
                    setEditEmail('');
                    setEditErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              사용자 삭제
            </h2>
            <p className="text-gray-600 mb-6">
              정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
