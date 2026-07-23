import { apiClient } from './client';
import { Job, JobCreateInput, JobListResponse, JobStatus, JobUpdateInput } from '../types';

export const fetchJobs = async (status?: JobStatus, skip = 0, limit = 20): Promise<JobListResponse> => {
  const response = await apiClient.get<JobListResponse>('/api/v1/jobs', {
    params: { status, skip, limit },
  });
  return response.data;
};

export const fetchJobById = async (id: number): Promise<Job> => {
  const response = await apiClient.get<Job>(`/api/v1/jobs/${id}`);
  return response.data;
};

export const createJob = async (input: JobCreateInput): Promise<Job> => {
  const response = await apiClient.post<Job>('/api/v1/jobs', input);
  return response.data;
};

export const updateJob = async (id: number, input: JobUpdateInput): Promise<Job> => {
  const response = await apiClient.patch<Job>(`/api/v1/jobs/${id}`, input);
  return response.data;
};

export const deleteJob = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/jobs/${id}`);
};
