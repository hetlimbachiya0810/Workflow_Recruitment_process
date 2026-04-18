import apiClient from './client';
import type { Vendor, PaginatedResponse } from '@/types';

export interface GetVendorsParams {
  is_approved?: boolean;
  page?: number;
  page_size?: number;
}

export const getVendors = async (params?: GetVendorsParams): Promise<PaginatedResponse<Vendor>> => {
  const response = await apiClient.get<PaginatedResponse<Vendor>>('/vendors', { params });
  return response.data;
};

export const getVendorById = async (id: string): Promise<Vendor> => {
  const response = await apiClient.get<Vendor>(`/vendors/${id}`);
  return response.data;
};

export const updateVendorApproval = async (id: string, is_approved: boolean): Promise<Vendor> => {
  const response = await apiClient.patch<Vendor>(`/vendors/${id}/approval`, { is_approved });
  return response.data;
};
