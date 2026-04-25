import apiClient from '@/shared/lib/apiClient';
import { Category } from '@/shared/types';

export const categoryAPI = {
  listCategories: async (params?: { branchId?: number; includeInactive?: boolean }) => {
    const response = await apiClient.get<any>('/categories', {
      params: {
        ...(params?.branchId && { branchId: params.branchId }),
        ...(params?.includeInactive && { includeInactive: 'true' }),
      },
    });
    return response.data.data as Category[];
  },

  getCategoryBySlug: async (slug: string) => {
    const response = await apiClient.get<any>(`/categories/${slug}`);
    return response.data.data as Category;
  },

  createCategory: async (data: Partial<Category>) => {
    const response = await apiClient.post<any>('/categories', data);
    return response.data.data as Category;
  },

  updateCategory: async (id: number, data: Partial<Category>) => {
    const response = await apiClient.put<any>(`/categories/${id}`, data);
    return response.data.data as Category;
  },

  updateCategoryStatus: async (id: number, data: { isActive?: boolean }) => {
    const response = await apiClient.patch<any>(`/categories/${id}/status`, data);
    return response.data.data as Category;
  },

  deleteCategory: async (id: number) => {
    const response = await apiClient.delete<any>(`/categories/${id}`);
    return response.data;
  },
};
