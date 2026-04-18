import apiClient from './client';
import type { AuthTokens, User } from '@/types';

export const login = async (email: string, password: string): Promise<AuthTokens> => {
  const response = await apiClient.post<AuthTokens>('/auth/login', {
    email,
    password,
  });
  return response.data;
};

export const refreshToken = async (refreshTokenValue: string): Promise<AuthTokens> => {
  const response = await apiClient.post<AuthTokens>('/auth/refresh', { refresh_token: refreshTokenValue });
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};
