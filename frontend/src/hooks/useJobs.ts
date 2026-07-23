import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteJob, fetchJobById, fetchJobs } from '../api/jobsApi';
import { submitGenerateJob } from '../api/generateApi';
import { Job, JobListResponse, JobStatus } from '../types';

export const useJobsList = (status?: JobStatus, skip = 0, limit = 20) => {
  return useQuery<JobListResponse>({
    queryKey: ['jobs', status, skip, limit],
    queryFn: () => fetchJobs(status, skip, limit),
    refetchInterval: 5000,
  });
};

export const useJobDetails = (jobId: number | null, autoPoll = true) => {
  return useQuery<Job>({
    queryKey: ['job', jobId],
    queryFn: () => fetchJobById(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      if (!autoPoll) return false;
      const currentJob = query.state.data;
      if (!currentJob) return 5000;
      if (currentJob.status === 'Pending' || currentJob.status === 'Processing') {
        return 5000; // Poll GET /api/v1/jobs/{id} every 5 seconds
      }
      return false; // Stop polling once Completed or Failed
    },
  });
};

export const useGenerateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => submitGenerateJob(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};
