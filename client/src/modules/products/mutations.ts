import { useMutation, UseMutationResult, UseMutationOptions } from '@tanstack/react-query';

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
  return useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
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
  return useMutation({
    mutationFn: async (data) => {
      const { id, ...updateData } = data;
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
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
  return useMutation({
    mutationFn: async (productId) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
    },
    ...options,
  });
};
