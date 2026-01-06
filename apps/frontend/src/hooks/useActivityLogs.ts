import { useQuery } from '@tanstack/react-query';
import { type PaginatedResponse } from '@side-project/shared';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export interface ActivityLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ActivityLogFilters {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  entity?: string;
  startDate?: string;
  endDate?: string;
}

export interface ActivityStats {
  actionStats: Array<{ action: string; count: number }>;
  entityStats: Array<{ entity: string; count: number }>;
  weekTrend: Array<{ date: string; count: number }>;
  total: number;
}

// 활동 로그 목록 조회
export const useActivityLogs = (filters: ActivityLogFilters = {}) => {
  const token = useAuthStore((state) => state.token);
  const {
    page = 1,
    limit = 20,
    action,
    userId,
    entity,
    startDate,
    endDate,
  } = filters;

  return useQuery({
    queryKey: ['activityLogs', page, limit, action, userId, entity, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(action && { action }),
        ...(userId && { userId }),
        ...(entity && { entity }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const data = await apiClient.get<PaginatedResponse<ActivityLog>>(
        `/api/activity?${params}`,
        token
      );

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || '활동 로그를 불러오는데 실패했습니다');
      }

      return data.data;
    },
    enabled: !!token,
  });
};

// 활동 로그 통계 조회
export const useActivityStats = (startDate?: string, endDate?: string) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['activityStats', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const data = await apiClient.get<ActivityStats>(
        `/api/activity/stats?${params}`,
        token
      );

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || '활동 로그 통계를 불러오는데 실패했습니다');
      }

      return data.data;
    },
    enabled: !!token,
  });
};

