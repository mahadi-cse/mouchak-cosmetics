import apiClient from '@/shared/lib/apiClient';
import { Product, PaginatedResponse, ListProductsParams } from '@/entities/types';

export const productAPI = {
  listProducts: async (params?: ListProductsParams) => {
    const response = await apiClient.get<PaginatedResponse<Product[]>>('/products', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        ...(params?.category && { category: params.category }),
        ...(params?.search && { search: params.search }),
        ...(params?.featured && { featured: 'true' }),
        ...(params?.minPrice !== undefined && { minPrice: params.minPrice }),
        ...(params?.maxPrice !== undefined && { maxPrice: params.maxPrice }),
      },
    });
    return response.data;
  },

  getProductBySlug: async (slug: string) => {
    const response = await apiClient.get<any>(`/products/${slug}`);
    return response.data.data;
  },

  getFeaturedProducts: async (limit: number = 8) => {
    const response = await apiClient.get<PaginatedResponse<Product[]>>('/products', {
      params: {
        featured: 'true',
        limit,
      },
    });
    return response.data.data;
  },
};
