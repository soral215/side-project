'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile, useUpdateProfile, useChangePassword, useDeleteAccount } from '../../src/hooks/useProfile';
import { useAuthStore } from '../../src/stores/authStore';
import { apiClient } from '../../src/lib/api';
import { updateProfileSchema, changePasswordSchema, ZodError } from '@side-project/shared';
import { useToast } from '../../src/contexts/ToastContext';
import { Button, Input, Card, Skeleton, SkeletonText } from '@side-project/design-system';
import { ThemeToggle } from '../../src/components/ThemeToggle';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://side-projectbackend-production-1e9c.up.railway.app';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  // 프로필 수정
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editErrors, setEditErrors] = useState<{ name?: string; email?: string }>({});
  
  // 비밀번호 변경
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});
  
  // 계정 삭제
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  
  // 이미지 업로드
  const [uploading, setUploading] = useState(false);

  // React Query hooks
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const deleteAccountMutation = useDeleteAccount();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditEmail(profile.email);
    }
  }, [profile]);

  useEffect(() => {
    if (mounted && profile && !isLoading) {
      // 프로필 로드 완료 시 한 번만 표시
      const hasShownWelcome = sessionStorage.getItem('profileWelcomeShown');
      if (!hasShownWelcome) {
        showInfo(`${profile.name}님, 프로필 페이지에 오신 것을 환영합니다.`);
        sessionStorage.setItem('profileWelcomeShown', 'true');
      }
    }
  }, [mounted, profile, isLoading, showInfo]);

  const handleEdit = () => {
    if (profile) {
      setEditName(profile.name);
      setEditEmail(profile.email);
      setEditErrors({});
      setEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditName(profile.name);
      setEditEmail(profile.email);
      setEditErrors({});
      setEditMode(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setEditErrors({});

    try {
      const validatedData = updateProfileSchema.parse({
        name: editName !== profile.name ? editName : undefined,
        email: editEmail !== profile.email ? editEmail : undefined,
      });

      await updateProfileMutation.mutateAsync(validatedData);
      setEditMode(false);
      showSuccess('프로필이 성공적으로 수정되었습니다.');
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setEditErrors(fieldErrors);
      } else {
        showError(error instanceof Error ? error.message : '프로필 수정에 실패했습니다.');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showWarning('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showWarning('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    try {
      setUploading(true);
      const token = useAuthStore.getState().token;
      const data = await apiClient.upload<{ fileUrl: string; user: typeof profile }>('/api/upload', file, token);

      if (data.success && data.data) {
        // 프로필 쿼리 무효화하여 다시 로드
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        showSuccess('프로필 이미지가 업로드되었습니다.');
      } else {
        showError(data.error?.message || '이미지 업로드에 실패했습니다.');
      }
    } catch (error: unknown) {
      console.error('Failed to upload image:', error);
      showError('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    try {
      const validatedData = changePasswordSchema.parse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      await changePasswordMutation.mutateAsync(validatedData);
      showSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setPasswordErrors(fieldErrors);
      } else {
        showError(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.');
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showWarning('비밀번호를 입력해주세요.');
      return;
    }

    if (!confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      await deleteAccountMutation.mutateAsync(deletePassword);
      showSuccess('계정이 삭제되었습니다.');
      router.push('/login');
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : '계정 삭제에 실패했습니다.');
    }
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

  if (isLoading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Skeleton width={100} height={24} />
          </div>
          <Card variant="elevated" padding="lg">
            <div className="space-y-6">
              {/* 프로필 이미지 스켈레톤 */}
              <div className="flex flex-col items-center">
                <Skeleton variant="circular" width={120} height={120} />
                <Skeleton width={150} height={20} className="mt-4" />
              </div>
              
              {/* 프로필 정보 스켈레톤 */}
              <div className="space-y-4">
                <div>
                  <Skeleton width={80} height={16} className="mb-2" />
                  <Skeleton width="100%" height={40} />
                </div>
                <div>
                  <Skeleton width={80} height={16} className="mb-2" />
                  <Skeleton width="100%" height={40} />
                </div>
              </div>
              
              {/* 버튼 스켈레톤 */}
              <div className="flex gap-2">
                <Skeleton width={120} height={40} />
                <Skeleton width={120} height={40} />
              </div>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">프로필을 불러올 수 없습니다.</p>
      </main>
    );
  }

  return (
      <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button
              onClick={() => router.push('/')}
              variant="secondary"
              size="sm"
              className="!bg-transparent !text-primary-600 dark:!text-primary-400 hover:!text-primary-700 dark:hover:!text-primary-500 !p-0 !font-normal"
            >
              ← 홈으로
            </Button>
            <ThemeToggle />
          </div>

          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">프로필 관리</h1>

        {/* 프로필 정보 카드 */}
        <Card variant="default" padding="md" className="mb-6">
          <div className="flex items-start gap-6 mb-6">
            {/* 프로필 이미지 */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {profile.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.imageUrl.startsWith('http') ? profile.imageUrl : `${API_URL}${profile.imageUrl}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-gray-400 dark:text-gray-500">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-blue-600 dark:bg-blue-500 text-white rounded-full p-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
                title="이미지 변경"
              >
                {uploading ? (
                  <span className="text-xs">업로드 중...</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* 프로필 정보 */}
            <div className="flex-1">
              {!editMode ? (
                <>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{profile.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{profile.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    가입일: {new Date(profile.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                  <Button
                    onClick={handleEdit}
                    className="mt-4"
                  >
                    프로필 수정
                  </Button>
                </>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      isLoading={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? '저장 중...' : '저장'}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCancelEdit}
                      variant="secondary"
                    >
                      취소
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Card>

        {/* 비밀번호 변경 카드 */}
        <Card variant="default" padding="md" className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">비밀번호 변경</h2>
            <Button
              onClick={() => {
                setShowPasswordChange(!showPasswordChange);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordErrors({});
              }}
              variant="secondary"
              size="sm"
              className="!bg-transparent !text-primary-600 hover:!text-primary-700 !p-0 !font-normal"
            >
              {showPasswordChange ? '취소' : '변경하기'}
            </Button>
          </div>
          {showPasswordChange && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                type="password"
                label="현재 비밀번호"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: undefined });
                }}
                error={passwordErrors.currentPassword}
                fullWidth
              />
              <Input
                type="password"
                label="새 비밀번호"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                }}
                error={passwordErrors.newPassword}
                fullWidth
              />
              <Input
                type="password"
                label="새 비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                }}
                error={passwordErrors.confirmPassword}
                fullWidth
              />
              <Button
                type="submit"
                isLoading={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </form>
          )}
        </Card>

        {/* 계정 삭제 카드 */}
        <Card variant="default" padding="md" className="border-l-4 border-red-500 dark:border-red-600">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">계정 삭제</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
          </p>
          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="danger"
            >
              계정 삭제
            </Button>
          ) : (
            <div className="space-y-4">
              <Input
                type="password"
                label="비밀번호 확인"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="계정 삭제를 위해 비밀번호를 입력하세요"
                fullWidth
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending || !deletePassword}
                  isLoading={deleteAccountMutation.isPending}
                  variant="danger"
                >
                  {deleteAccountMutation.isPending ? '삭제 중...' : '확인 및 삭제'}
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  variant="secondary"
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
