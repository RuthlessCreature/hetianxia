import client from './client';
import type { ImageAsset } from '../types';

export const imageApi = {
  upload: (projectId: string, files: FormData) =>
    client.post<ImageAsset>(`/projects/${projectId}/images/upload`, files, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (projectId: string, params?: any) =>
    client.get<{ images: ImageAsset[]; total: number }>(`/projects/${projectId}/images`, { params }),
  get: (id: string) => client.get<ImageAsset>(`/images/${id}`),
  delete: (id: string) => client.delete(`/images/${id}`),
};
