import apiClient from './client';
import type { CVSubmission } from '@/types';

export interface GetMySubmissionsParams {
  jd_id?: string;
  skip?: number;
  limit?: number;
}

export const submitCV = async (formData: FormData): Promise<CVSubmission> => {
  const response = await apiClient.post<CVSubmission>('/submissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getMySubmissions = async (params?: GetMySubmissionsParams): Promise<CVSubmission[]> => {
  const response = await apiClient.get<CVSubmission[]>('/submissions/my', { params });
  return response.data;
};
