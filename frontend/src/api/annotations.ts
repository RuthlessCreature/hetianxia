import client from './client';
import type { Annotation } from '../types';

export const annotationApi = {
  create: (imageId: string, data: Partial<Annotation>) =>
    client.post<Annotation>(`/images/${imageId}/annotations`, data),
  list: (imageId: string) => client.get<Annotation[]>(`/images/${imageId}/annotations`),
  update: (id: string, data: Partial<Annotation>) =>
    client.patch<Annotation>(`/annotations/${id}`, data),
  delete: (id: string) => client.delete(`/annotations/${id}`),
  review: (id: string, status: string) =>
    client.post<Annotation>(`/annotations/${id}/review`, { status }),
  batchReview: (ids: string[], status: string) =>
    client.post<any>(`/annotations/batch-review`, ids, { params: { status }, headers: { 'Content-Type': 'application/json' } }),
  listPending: (projectId: string) =>
    client.get<Annotation[]>(`/projects/${projectId}/pending-reviews`),
};
