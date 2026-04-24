import apiClient from '@/shared/lib/apiClient';
import type { PaginatedResponse, ApiResponse } from '@/shared/types';

export interface Supplier { id: number; name: string; email?: string | null; phone?: string | null; address?: string | null; rotationDays?: number | null; isActive: boolean; createdAt: string; }
export interface SupplierTransactionItem { id: number; productId: number; productNameSnapshot: string; productSkuSnapshot: string; quantity: number; unitPrice: number; lineTotal: number; }
export interface SupplierTransaction { id: number; supplierId: number; supplier?: { name: string }; branchId?: number | null; branchName?: string | null; direction: 'DUE_TO_SUPPLIER' | 'DUE_TO_US'; totalAmount: number; totalQty: number; transactionDate: string; note?: string | null; recordedBy?: string | null; createdAt: string; items: SupplierTransactionItem[]; }

export interface CreateSupplierRequest { name: string; email?: string; phone?: string; address?: string; rotationDays?: number; }
export interface CreateTransactionRequest { supplierId: number; branchId?: number; branchName?: string; direction: 'DUE_TO_SUPPLIER' | 'DUE_TO_US'; totalAmount: number; transactionDate?: string; note?: string; recordedBy?: string; items?: Array<{ productId: number; quantity: number; unitPrice: number }>; }

export const suppliersAPI = {
  list: async (params?: { page?: number; limit?: number; search?: string; includeInactive?: boolean }) => {
    const res = await apiClient.get<any>('/suppliers', { params: { page: params?.page || 1, limit: params?.limit || 50, ...(params?.search ? { search: params.search } : {}), ...(params?.includeInactive ? { includeInactive: 'true' } : {}) } });
    const p = res.data; return { success: true, data: p?.data ?? [], pagination: { page: p?.meta?.page ?? 1, limit: p?.meta?.limit ?? 50, total: p?.meta?.total ?? 0, pages: p?.meta?.totalPages ?? 1 } } as PaginatedResponse<Supplier>;
  },
  get: async (id: number) => { const res = await apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`); return res.data.data; },
  create: async (data: CreateSupplierRequest) => { const res = await apiClient.post<ApiResponse<Supplier>>('/suppliers', data); return res.data.data; },
  update: async (id: number, data: Partial<CreateSupplierRequest & { isActive: boolean }>) => { const res = await apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data); return res.data.data; },
  delete: async (id: number) => { await apiClient.delete(`/suppliers/${id}`); },
  listTransactions: async (params?: { supplierId?: number; page?: number; limit?: number; search?: string; sortOrder?: 'asc' | 'desc' }) => {
    const res = await apiClient.get<any>('/suppliers/transactions', { params: { page: params?.page || 1, limit: params?.limit || 20, ...(params?.supplierId ? { supplierId: params.supplierId } : {}), ...(params?.search ? { search: params.search } : {}), ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}) } });
    const p = res.data; return { success: true, data: p?.data ?? [], pagination: { page: p?.meta?.page ?? 1, limit: p?.meta?.limit ?? 20, total: p?.meta?.total ?? 0, pages: p?.meta?.totalPages ?? 1 } } as PaginatedResponse<SupplierTransaction>;
  },
  createTransaction: async (data: CreateTransactionRequest) => { const res = await apiClient.post<ApiResponse<SupplierTransaction>>('/suppliers/transactions', data); return res.data.data; },
};
