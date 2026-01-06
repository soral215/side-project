import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type User, type PaginatedResponse, updateUserSchema } from '@side-project/shared';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

// 사용자 목록 조회
export const useUsers = (page: number = 1, limit: number = 10, search: string = '', useAiSearch: boolean = false) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['users', page, limit, search, useAiSearch],
    queryFn: async () => {
      if (useAiSearch && search) {
        // AI 검색 사용
        const data = await apiClient.post<PaginatedResponse<User>>(
          '/api/users/ai-search',
          { query: search, page, limit },
          token
        );
        if (!data.success || !data.data) {
          throw new Error(data.error?.message || 'AI 검색에 실패했습니다');
        }
        return data.data;
      } else {
        // 기본 검색
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
        });
        const data = await apiClient.get<PaginatedResponse<User>>(`/api/users?${params}`, token);
        if (!data.success || !data.data) {
          throw new Error(data.error?.message || '사용자 목록을 불러오는데 실패했습니다');
        }
        return data.data;
      }
    },
    enabled: !!token,
  });
};

// 사용자 수정
export const useUpdateUser = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; email?: string } }) => {
      const validatedData = updateUserSchema.parse(data);
      const response = await apiClient.put<User>(`/api/users/${id}`, validatedData, token);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '사용자 수정에 실패했습니다');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// 사용자 삭제
export const useDeleteUser = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<{ message: string }>(`/api/users/${id}`, token);
      if (!response.success) {
        throw new Error(response.error?.message || '사용자 삭제에 실패했습니다');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
