import { apiClient } from './client';
import { GenerateJobResponse } from '../types';

export const submitGenerateJob = async (formData: FormData): Promise<GenerateJobResponse> => {
  const response = await apiClient.post<GenerateJobResponse>('/api/v1/generate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
