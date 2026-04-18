import apiClient from './client';
import type { User, PaginatedResponse, UserCreate, UserUpdate } from '@/types';

export interface GetUsersParams {
  role?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export const getUsers = async (params?: GetUsersParams): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get<PaginatedResponse<User>>('/users', { params });
  return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${id}`);
  return response.data;
};

export const createUser = async (payload: UserCreate): Promise<User> => {
  const response = await apiClient.post<User>('/users', payload);
  return response.data;
};

export const updateUser = async (id: string, payload: UserUpdate): Promise<User> => {
  const response = await apiClient.patch<User>(`/users/${id}`, payload);
  return response.data;
};

export const deactivateUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};
