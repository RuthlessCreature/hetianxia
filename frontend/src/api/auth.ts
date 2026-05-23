import client from './client';
import type { LoginData, RegisterData, AuthResponse, User } from '../types';

export const authApi = {
  register: (data: RegisterData) => client.post<AuthResponse>('/auth/register', data),
  login: (data: LoginData) => client.post<AuthResponse>('/auth/login', data),
  me: () => client.get<User>('/auth/me'),
  logout: () => client.post('/auth/logout'),
};
