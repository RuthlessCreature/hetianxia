export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  tenant_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  license_start: string | null;
  license_end: string | null;
  status: string;
  max_users: number;
  max_projects: number;
  max_images: number;
  max_storage_gb: number;
  max_training_jobs_per_month: number;
  max_prelabel_jobs_per_month: number;
  allow_model_export: boolean;
  allow_private_deploy: boolean;
}

export interface Usage {
  projects_used: number;
  projects_max: number;
  images_used: number;
  images_max: number;
  training_jobs_used: number;
  training_jobs_max: number;
  storage_used_gb: number;
  storage_max_gb: number;
}

export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  task_type: string | null;
  image_type: string;
  status: string;
  image_count: number;
  annotation_count: number;
  created_at: string;
  updated_at: string;
}

export interface ImageAsset {
  id: string;
  project_id: string;
  file_path: string;
  thumbnail_path: string | null;
  file_name: string;
  width: number | null;
  height: number | null;
  label_status: string;
  quality_status: string;
  annotation_count: number;
  created_at: string;
}

export interface Annotation {
  id: string;
  image_id: string;
  project_id: string;
  annotation_type: string;
  label: string | null;
  geometry: any;
  source: string;
  status: string;
  confidence: number | null;
  created_by: string | null;
  reviewed_by: string | null;
}

export interface DatasetVersion {
  id: string;
  project_id: string;
  version: string;
  name: string | null;
  description: string | null;
  train_count: number;
  val_count: number;
  test_count: number;
  status: string;
}

export interface TrainingJob {
  id: string;
  project_id: string;
  dataset_version_id: string | null;
  task_type: string;
  strategy: string | null;
  config: any;
  status: string;
  logs: string | null;
  metrics: any;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface ModelRegistry {
  id: string;
  project_id: string;
  training_job_id: string | null;
  version: string;
  artifact_path: string | null;
  model_format: string | null;
  metrics: any;
  status: string;
  created_at: string;
}

export interface EvaluationReport {
  id: string;
  project_id: string;
  model_id: string;
  dataset_version_id: string | null;
  task_type: string;
  threshold: number | null;
  metrics: any;
  failure_cases: any;
  created_at: string;
}

export interface PrelabelJob {
  id: string;
  project_id: string;
  status: string;
  method: string | null;
  image_count: number;
  result: any;
}
