export type JobStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

export interface Job {
  id: number;
  product_name: string;
  product_description?: string | null;
  uploaded_image_path?: string | null;
  generated_prompt?: string | null;
  generated_image_url?: string | null;
  status: JobStatus;
  processing_started_at?: string | null;
  completed_at?: string | null;
  duration_seconds?: number | null;
  created_at: string;
  updated_at: string;
}

export interface JobCreateInput {
  product_name: string;
  product_description?: string;
  uploaded_image_path?: string;
}

export interface JobUpdateInput {
  product_name?: string;
  product_description?: string;
  uploaded_image_path?: string;
  generated_prompt?: string;
  generated_image_url?: string;
  status?: JobStatus;
}

export interface JobListResponse {
  total: number;
  items: Job[];
}

export interface HealthStatus {
  status: string;
  database: string;
  service: string;
}

export interface GenerateJobResponse {
  job_id: number;
  status: JobStatus;
  message: string;
  created_at: string;
}

export interface GeneratedContent {
  headline: string;
  tagline: string;
  body_copy: string;
  hashtags: string[];
  call_to_action: string;
  visual_prompt: string;
}
