import apiClient from './client';
import type { JD, JDCreate, JDUpdate, JDVendorAssignment } from '@/types';

export interface GetJDsParams {
  status?: string;
  skip?: number;
  limit?: number;
}

export const getJDs = async (params?: GetJDsParams): Promise<JD[]> => {
  const response = await apiClient.get<JD[]>('/jds', { params });
  return response.data;
};

export const getJDById = async (id: string): Promise<JD> => {
  const response = await apiClient.get<JD>(`/jds/${id}`);
  return response.data;
};

export const createJD = async (payload: JDCreate): Promise<JD> => {
  const response = await apiClient.post<JD>('/jds', payload);
  return response.data;
};

export const updateJD = async (id: string, payload: JDUpdate): Promise<JD> => {
  const response = await apiClient.patch<JD>(`/jds/${id}`, payload);
  return response.data;
};

export const updateJDStatus = async (id: string, status: string): Promise<JD> => {
  const response = await apiClient.patch<JD>(`/jds/${id}/status`, { status });
  return response.data;
};

export interface FloatJDPayload {
  vendor_ids: number[];
  deadline?: string;
}

export const floatJD = async (id: string, payload: FloatJDPayload): Promise<JDVendorAssignment[]> => {
  const response = await apiClient.post<JDVendorAssignment[]>(`/jds/${id}/float`, payload);
  return response.data;
};

export const getJDAssignments = async (id: string): Promise<JDVendorAssignment[]> => {
  const response = await apiClient.get<JDVendorAssignment[]>(`/jds/${id}/assignments`);
  return response.data;
};

export const acknowledgeJD = async (jd_id: string): Promise<JDVendorAssignment> => {
  const response = await apiClient.patch<JDVendorAssignment>(`/jds/${jd_id}/acknowledge`);
  return response.data;
};
