import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type ApiResponse, loginSchema, registerSchema } from '@side-project/shared';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

// 로그인
export const useLogin = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const validatedData = loginSchema.parse(credentials);
      const response = await apiClient.post<{ user: any; token: string }>(
        '/api/auth/login',
        validatedData
      );
      if (!response.success || !response.data) {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
      }
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      router.push('/');
    },
  });
};

// 회원가입
export const useRegister = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const validatedData = registerSchema.parse(data);
      const response = await apiClient.post<{ user: any; token: string }>(
        '/api/auth/register',
        validatedData
      );
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '회원가입에 실패했습니다');
      }
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      router.push('/');
    },
  });
};
