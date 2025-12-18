'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { type ApiResponse, updateProfileSchema, changePasswordSchema, ZodError } from '@side-project/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Profile {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // 프로필 수정
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editErrors, setEditErrors] = useState<{ name?: string; email?: string }>({});
  const [editLoading, setEditLoading] = useState(false);
  
  // 비밀번호 변경
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // 계정 삭제
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // 이미지 업로드
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      fetchProfile();
    }
  }, [mounted, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data: ApiResponse<Profile> = await response.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setEditName(data.data.name);
        setEditEmail(data.data.email);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
    setEditErrors({});
    setEditLoading(true);

    try {
      const validatedData = updateProfileSchema.parse({
        name: editName !== profile!.name ? editName : undefined,
        email: editEmail !== profile!.email ? editEmail : undefined,
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validatedData),
      });

      const data: ApiResponse<Profile> = await response.json();

      if (data.success && data.data) {
        setProfile(data.data);
        // localStorage의 user 정보도 업데이트
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...user, ...data.data }));
        setEditMode(false);
        alert('프로필이 성공적으로 수정되었습니다.');
      } else if (data.error) {
        if (data.error.code === 'VALIDATION_ERROR' && 'details' in data.error) {
          const fieldErrors: { [key: string]: string } = {};
          const details = (data.error as any).details as Array<{ field: string; message: string }>;
          details.forEach((detail) => {
            fieldErrors[detail.field] = detail.message;
          });
          setEditErrors(fieldErrors);
        } else {
          alert(data.error.message || '프로필 수정에 실패했습니다.');
        }
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setEditErrors(fieldErrors);
      } else {
        console.error('Failed to update profile:', error);
        alert('프로필 수정에 실패했습니다.');
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data: ApiResponse<{ fileUrl: string; user: Profile }> = await response.json();

      if (data.success && data.data) {
        setProfile(data.data.user);
        // localStorage의 user 정보도 업데이트
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...user, imageUrl: data.data.user.imageUrl }));
        alert('프로필 이미지가 업로드되었습니다.');
      } else {
        alert(data.error?.message || '이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('이미지 업로드에 실패했습니다.');
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
    setPasswordLoading(true);

    try {
      const validatedData = changePasswordSchema.parse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validatedData),
      });

      const data: ApiResponse<{ message: string }> = await response.json();

      if (data.success) {
        alert('비밀번호가 성공적으로 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordChange(false);
      } else if (data.error) {
        if (data.error.code === 'VALIDATION_ERROR' && 'details' in data.error) {
          const fieldErrors: { [key: string]: string } = {};
          const details = (data.error as any).details as Array<{ field: string; message: string }>;
          details.forEach((detail) => {
            fieldErrors[detail.field] = detail.message;
          });
          setPasswordErrors(fieldErrors);
        } else {
          alert(data.error.message || '비밀번호 변경에 실패했습니다.');
        }
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setPasswordErrors(fieldErrors);
      } else {
        console.error('Failed to change password:', error);
        alert('비밀번호 변경에 실패했습니다.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    if (!confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data: ApiResponse<{ message: string }> = await response.json();

      if (data.success) {
        alert('계정이 삭제되었습니다.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      } else {
        alert(data.error?.message || '계정 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('계정 삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">프로필을 불러올 수 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← 홈으로
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-8 text-gray-900">프로필 관리</h1>

        {/* 프로필 정보 카드 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start gap-6 mb-6">
            {/* 프로필 이미지 */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profile.imageUrl ? (
                  <img
                    src={profile.imageUrl.startsWith('http') ? profile.imageUrl : `${API_URL}${profile.imageUrl}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-gray-400">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">{profile.name}</h2>
                  <p className="text-gray-600 mb-4">{profile.email}</p>
                  <p className="text-sm text-gray-500">
                    가입일: {new Date(profile.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                  <button
                    onClick={handleEdit}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    프로필 수정
                  </button>
                </>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {editLoading ? '저장 중...' : '저장'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* 비밀번호 변경 카드 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">비밀번호 변경</h2>
            <button
              onClick={() => {
                setShowPasswordChange(!showPasswordChange);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordErrors({});
              }}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {showPasswordChange ? '취소' : '변경하기'}
            </button>
          </div>
          {showPasswordChange && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    passwordErrors.currentPassword
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    passwordErrors.newPassword
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    passwordErrors.confirmPassword
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {passwordLoading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}
        </div>

        {/* 계정 삭제 카드 */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">계정 삭제</h2>
          <p className="text-sm text-gray-600 mb-4">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              계정 삭제
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="계정 삭제를 위해 비밀번호를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || !deletePassword}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? '삭제 중...' : '확인 및 삭제'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

