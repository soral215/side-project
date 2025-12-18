import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ApiResponse, updateProfileSchema, changePasswordSchema } from '@side-project/shared';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface Profile {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// 프로필 조회
export const useProfile = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const data = await apiClient.get<Profile>('/api/profile', token);
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || '프로필을 불러오는데 실패했습니다');
      }
      return data.data;
    },
    enabled: !!token,
  });
};

// 프로필 수정
export const useUpdateProfile = () => {
  const token = useAuthStore((state) => state.token);
  const updateUser = useAuthStore((state) => state.updateUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name?: string; email?: string }) => {
      const validatedData = updateProfileSchema.parse(data);
      const response = await apiClient.put<Profile>('/api/profile', validatedData, token);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '프로필 수정에 실패했습니다');
      }
      return response.data;
    },
    onSuccess: (data) => {
      updateUser(data);
      queryClient.setQueryData(['profile'], data);
    },
  });
};

// 비밀번호 변경
export const useChangePassword = () => {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      const validatedData = changePasswordSchema.parse(data);
      const response = await apiClient.put<{ message: string }>(
        '/api/profile/password',
        validatedData,
        token
      );
      if (!response.success) {
        throw new Error(response.error?.message || '비밀번호 변경에 실패했습니다');
      }
      return response.data;
    },
  });
};

// 계정 삭제
export const useDeleteAccount = () => {
  const token = useAuthStore((state) => state.token);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async (password: string) => {
      const response = await apiClient.delete<{ message: string }>(
        '/api/profile',
        token,
        { password }
      );
      if (!response.success) {
        throw new Error(response.error?.message || '계정 삭제에 실패했습니다');
      }
      return response.data;
    },
    onSuccess: () => {
      clearAuth();
    },
  });
};
