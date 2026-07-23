import { useQuery } from '@tanstack/react-query';
import { fetchHealthStatus } from '../api/healthApi';
import { HealthStatus } from '../types';

export const useHealthCheck = () => {
  return useQuery<HealthStatus, Error>({
    queryKey: ['healthStatus'],
    queryFn: fetchHealthStatus,
    refetchInterval: 15000, // Refresh every 15s for status monitoring
  });
};
