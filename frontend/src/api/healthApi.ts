import { apiClient } from './client';
import { HealthStatus } from '../types';

export const fetchHealthStatus = async (): Promise<HealthStatus> => {
  const response = await apiClient.get<HealthStatus>('/api/v1/health');
  return response.data;
};
