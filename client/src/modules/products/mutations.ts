import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/lib/apiClient';

export interface CreateProductPayload {
  name: string;
  slug: string;
  description: string;
  price: number;
  sku: string;
  categoryId: number;
  images: string[];
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  id: number;
}

/**
 * Create product mutation (admin only)
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProductPayload) => {
      const response = await apiClient.post('/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

/**
 * Update product mutation (admin only)
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateProductPayload) => {
      const { id, ...updateData } = data;
      const response = await apiClient.put(`/products/${id}`, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['homepage', 'featuredProducts'] });
      queryClient.invalidateQueries({ queryKey: ['homepage', 'sliders'] });
    },
  });
};

/**
 * Delete product mutation (admin only)
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: number) => {
      await apiClient.delete(`/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
