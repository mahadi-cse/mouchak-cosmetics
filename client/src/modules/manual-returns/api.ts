import apiClient from '@/shared/lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export interface ManualReturnItemPayload {
  productId: number;
  quantity: number;
  unitPrice?: number;
  sizeName?: string;
}

export interface CreateManualReturnRequest {
  returnedBy?: string;
  reason?: string;
  branchId?: number;
  branchName?: string;
  items: ManualReturnItemPayload[];
}

export interface ManualReturnItemResponse {
  id: number;
  productId: number;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ManualReturnResponse {
  id: number;
  returnNumber: string;
  totalQty: number;
  totalAmount: number;
  branchId?: number;
  branchName?: string;
  returnedBy?: string;
  reason?: string;
  createdAt: string;
  items: ManualReturnItemResponse[];
}

export interface ListManualReturnsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'totalAmount' | 'totalQty' | 'returnNumber';
  sortOrder?: 'asc' | 'desc';
}

export const manualReturnsAPI = {
  listManualReturns: async (params?: ListManualReturnsParams) => {
    const response = await apiClient.get<any>('/manual-returns', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
        ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
      },
    });
    const payload = response.data;
    return {
      success: payload?.success ?? true,
      data: payload?.data ?? [],
      pagination: {
        page: payload?.meta?.page ?? 1,
        limit: payload?.meta?.limit ?? 20,
        total: payload?.meta?.total ?? 0,
        pages: payload?.meta?.totalPages ?? 1,
      },
      message: payload?.message,
    } as PaginatedResponse<ManualReturnResponse>;
  },

  createManualReturn: async (data: CreateManualReturnRequest) => {
    const response = await apiClient.post<ApiResponse<ManualReturnResponse>>('/manual-returns', data);
    return response.data.data;
  },
};
