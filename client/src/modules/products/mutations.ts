import { useMutation, UseMutationResult, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
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
export const useCreateProduct = (
  options?: UseMutationOptions<any, Error, CreateProductPayload>
): UseMutationResult<any, Error, CreateProductPayload> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/products', data);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Update product mutation (admin only)
 */
export const useUpdateProduct = (
  options?: UseMutationOptions<any, Error, UpdateProductPayload>
): UseMutationResult<any, Error, UpdateProductPayload> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const { id, ...updateData } = data;
      const response = await apiClient.put(`/products/${id}`, updateData);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['homepage', 'featuredProducts'] });
      queryClient.invalidateQueries({ queryKey: ['homepage', 'sliders'] });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Delete product mutation (admin only)
 */
export const useDeleteProduct = (
  options?: UseMutationOptions<void, Error, number>
): UseMutationResult<void, Error, number> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId) => {
      await apiClient.delete(`/products/${productId}`);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
