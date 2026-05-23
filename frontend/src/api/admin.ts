import client from './client';

export const userApi = {
  list: () => client.get<any[]>('/users'),
  get: (id: string) => client.get<any>(`/users/${id}`),
  invite: (params: { email: string; name: string; role: string; password?: string }) =>
    client.post<any>('/users/invite', null, { params }),
  changeRole: (userId: string, role: string) =>
    client.patch<any>(`/users/${userId}/role`, null, { params: { role } }),
  changeStatus: (userId: string, status: string) =>
    client.patch<any>(`/users/${userId}/status`, null, { params: { status } }),
};

export const auditApi = {
  list: (limit = 100) => client.get<any[]>('/audit/logs', { params: { limit } }),
  listByUser: (userId: string) => client.get<any[]>(`/audit/logs/user/${userId}`),
};

export const deployApi = {
  list: (projectId: string) => client.get<any[]>(`/projects/${projectId}/deployments`),
  create: (projectId: string, params: { model_id: string; name: string; target?: string }) =>
    client.post<any>(`/projects/${projectId}/deployments`, null, { params }),
  get: (id: string) => client.get<any>(`/deployments/${id}`),
  updateStatus: (id: string, status: string) =>
    client.patch<any>(`/deployments/${id}/status`, null, { params: { status } }),
  delete: (id: string) => client.delete(`/deployments/${id}`),
};

export const notifApi = {
  list: (unreadOnly = false) => client.get<any[]>('/notifications', { params: { unread_only: unreadOnly } }),
  markRead: (id: string) => client.post<any>(`/notifications/${id}/read`),
  markAllRead: () => client.post<any>('/notifications/read-all'),
  delete: (id: string) => client.delete(`/notifications/${id}`),
};

export const exportApi = {
  model: (modelId: string) => client.get<any>(`/export/model/${modelId}`),
  dataset: (dsId: string) => client.get<any>(`/export/dataset/${dsId}`),
  evaluation: (reportId: string) => client.get<any>(`/export/evaluation/${reportId}`),
};
