import client from './client';
import type { EvaluationReport, DatasetVersion } from '../types';

export const evaluationApi = {
  create: (modelId: string, data?: any) =>
    client.post<EvaluationReport>(`/models/${modelId}/evaluate`, data || {}),
  get: (id: string) => client.get<EvaluationReport>(`/evaluation-reports/${id}`),
  listByModel: (modelId: string) =>
    client.get<EvaluationReport[]>(`/models/${modelId}/evaluation-reports`),
};

export const datasetApi = {
  create: (projectId: string, data?: any) =>
    client.post<DatasetVersion>(`/projects/${projectId}/dataset-versions`, data || {}),
  list: (projectId: string) =>
    client.get<DatasetVersion[]>(`/projects/${projectId}/dataset-versions`),
  get: (id: string) => client.get<DatasetVersion>(`/dataset-versions/${id}`),
  freeze: (id: string) => client.post<DatasetVersion>(`/dataset-versions/${id}/freeze`),
};

export const modelApi = {
  list: (projectId: string) => client.get<any[]>(`/projects/${projectId}/models`),
  get: (id: string) => client.get<any>(`/models/${id}`),
  test: (id: string) => client.post<any>(`/models/${id}/test`, {}),
  export: (id: string) => client.post<any>(`/models/${id}/export`),
  rollback: (id: string) => client.post<any>(`/models/${id}/rollback`),
  deploy: (id: string) => client.post<any>(`/models/${id}/deploy`),
};

export const prelabelApi = {
  create: (projectId: string, data: any) =>
    client.post<any>(`/projects/${projectId}/prelabel-jobs`, data),
  list: (projectId: string) => client.get<any[]>(`/projects/${projectId}/prelabel-jobs`),
};
