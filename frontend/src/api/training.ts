import client from './client';
import type { TrainingJob } from '../types';

export const trainingApi = {
  create: (projectId: string, data: Partial<TrainingJob>) =>
    client.post<TrainingJob>(`/projects/${projectId}/training-jobs`, data),
  list: (projectId: string) => client.get<TrainingJob[]>(`/projects/${projectId}/training-jobs`),
  get: (id: string) => client.get<TrainingJob>(`/training-jobs/${id}`),
  cancel: (id: string) => client.post<TrainingJob>(`/training-jobs/${id}/cancel`),
};
