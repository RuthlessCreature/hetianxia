import client from './client';
import type { Project, Tenant, Usage } from '../types';

export const projectApi = {
  list: () => client.get<Project[]>('/projects'),
  get: (id: string) => client.get<Project>(`/projects/${id}`),
  create: (data: Partial<Project>) => client.post<Project>('/projects', data),
  update: (id: string, data: Partial<Project>) => client.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) => client.delete(`/projects/${id}`),
};

export const tenantApi = {
  current: () => client.get<Tenant>('/tenant/current'),
  license: () => client.get<any>('/license/current'),
  usage: () => client.get<Usage>('/usage'),
};
