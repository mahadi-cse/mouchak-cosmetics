import apiClient from '@/shared/lib/apiClient';
import { Product, PaginatedResponse, ListProductsParams } from '@/shared/types';

export const productAPI = {
  listProducts: async (params?: ListProductsParams & { includeInactive?: boolean }) => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/products', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        ...(params?.category && { category: params.category }),
        ...(params?.search && { search: params.search }),
        ...(params?.featured && { featured: 'true' }),
        ...(params?.minPrice !== undefined && { minPrice: params.minPrice }),
        ...(params?.maxPrice !== undefined && { maxPrice: params.maxPrice }),
        ...(params?.branchId !== undefined && { branchId: params.branchId }),
        ...(params?.includeInactive && { includeInactive: 'true' }),
      },
    });
    return response.data;
  },

  updateProductStatus: async (id: number, data: { isActive?: boolean; isFeatured?: boolean }) => {
    const response = await apiClient.patch<any>(`/products/${id}/status`, data);
    return response.data.data as Product;
  },

  getProductBySlug: async (slug: string) => {
    const response = await apiClient.get<any>(`/products/${slug}`);
    return response.data.data;
  },

  getFeaturedProducts: async (limit: number = 8) => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/products', {
      params: {
        featured: 'true',
        limit,
      },
    });
    return response.data.data;
  },

  createProduct: async (data: Partial<Product>) => {
    const response = await apiClient.post<any>('/products', data);
    return response.data.data as Product;
  },

  updateProduct: async (id: number, data: Partial<Product>) => {
    const response = await apiClient.put<any>(`/products/${id}`, data);
    return response.data.data as Product;
  },

  deleteProduct: async (id: number) => {
    const response = await apiClient.delete<any>(`/products/${id}`);
    return response.data;
  },
};
