import apiClient from '@/shared/lib/apiClient';
import type { ApiResponse } from '@/shared/types';

export interface BranchDTO {
  id: number;
  name: string;
  branchCode: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  managerName?: string | null;
  managerPhone?: string | null;
  branchType: string;
  active: boolean;
  stock: number;
  orders: number;
  revenue: number;
}

export interface BranchUpsertPayload {
  name: string;
  branchCode: string;
  branchType: 'WAREHOUSE' | 'RETAIL' | 'OFFICE' | 'DISTRIBUTION';
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  managerPhone?: string;
  isActive?: boolean;
}

export const branchesAPI = {
  listBranches: async () => {
    const response = await apiClient.get<ApiResponse<BranchDTO[]>>('/branches');
    return response.data.data || [];
  },
  createBranch: async (data: BranchUpsertPayload) => {
    const response = await apiClient.post<ApiResponse<BranchDTO>>('/branches', data);
    return response.data.data!;
  },
  updateBranch: async (id: number, data: Partial<BranchUpsertPayload>) => {
    const response = await apiClient.patch<ApiResponse<BranchDTO>>(`/branches/${id}`, data);
    return response.data.data!;
  },
  setBranchStatus: async (id: number, isActive: boolean) => {
    const response = await apiClient.patch<ApiResponse<BranchDTO>>(`/branches/${id}/status`, { isActive });
    return response.data.data!;
  },
};
