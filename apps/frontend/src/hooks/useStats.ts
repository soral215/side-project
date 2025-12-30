import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export interface StatsOverview {
  totalUsers: number;
  recentUsers7d: number;
  recentUsers30d: number;
  todayUsers: number;
  growthRate: number;
}

export interface ActivityData {
  name: string;
  users: number;
  active: number;
  date: string;
}

export interface HourlyData {
  time: string;
  count: number;
}

export interface UserTypeData {
  name: string;
  value: number;
}

// 통계 개요 조회
export const useStatsOverview = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: async () => {
      const data = await apiClient.get<StatsOverview>('/api/stats/overview', token);
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || '통계를 불러오는데 실패했습니다');
      }
      return data.data;
    },
    enabled: !!token,
    staleTime: 60 * 1000, // 1분간 캐시
  });
};

// 주간 활동 조회
export const useActivityStats = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['stats', 'activity'],
    queryFn: async () => {
      const data = await apiClient.get<ActivityData[]>('/api/stats/activity', token);
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || '활동 통계를 불러오는데 실패했습니다');
      }
      return data.data;
    },
    enabled: !!token,
    staleTime: 60 * 1000,
  });
};

// 시간대별 활동 조회
export const useHourlyStats = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['stats', 'hourly'],
    queryFn: async () => {
      const data = await apiClient.get<HourlyData[]>('/api/stats/hourly', token);
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || '시간대별 통계를 불러오는데 실패했습니다');
      }
      return data.data;
    },
    enabled: !!token,
    staleTime: 60 * 1000,
  });
};

// 사용자 유형 분포 조회
export const useUserTypeStats = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['stats', 'user-types'],
    queryFn: async () => {
      const data = await apiClient.get<UserTypeData[]>('/api/stats/user-types', token);
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || '사용자 유형 통계를 불러오는데 실패했습니다');
      }
      return data.data;
    },
    enabled: !!token,
    staleTime: 60 * 1000,
  });
};


