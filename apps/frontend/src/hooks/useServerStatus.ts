import { useQuery } from '@tanstack/react-query';
import { checkHealth } from '../lib/api';

export const useServerStatus = () => {
  return useQuery({
    queryKey: ['serverStatus'],
    queryFn: checkHealth,
    refetchInterval: 30000, // 30초마다 체크
    retry: false,
  });
};


