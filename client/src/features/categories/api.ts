import apiClient from '@/shared/lib/apiClient';
import { Category } from '@/entities/types';

export const categoryAPI = {
  listCategories: async () => {
    const response = await apiClient.get<any>('/categories');
    return response.data.data as Category[];
  },

  getCategoryBySlug: async (slug: string) => {
    const response = await apiClient.get<any>(`/categories/${slug}`);
    return response.data.data as Category;
  },
};
