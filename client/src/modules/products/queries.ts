import {
  useQuery,
  UseQueryResult,
  UseQueryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { productAPI } from './api';
import { Product, PaginatedResponse, ListProductsParams } from '@/shared/types';

export const PRODUCTS_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCTS_QUERY_KEYS.all, 'list'] as const,
  list: (params: ListProductsParams) => [...PRODUCTS_QUERY_KEYS.lists(), params] as const,
  details: () => [...PRODUCTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (slug: string) => [...PRODUCTS_QUERY_KEYS.details(), slug] as const,
  featured: () => [...PRODUCTS_QUERY_KEYS.all, 'featured'] as const,
};

export const useListProducts = (
  params?: ListProductsParams,
  options?: any
): UseQueryResult<Product[], Error> => {
  return useQuery<PaginatedResponse<Product>, Error, Product[]>({
    queryKey: PRODUCTS_QUERY_KEYS.list(params || {}),
    queryFn: () => productAPI.listProducts(params),
    select: (data) => data.data as any,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useProductBySlug = (
  slug: string,
  options?: UseQueryOptions<Product, Error>
): UseQueryResult<Product, Error> => {
  return useQuery<Product, Error>({
    queryKey: PRODUCTS_QUERY_KEYS.detail(slug),
    queryFn: () => productAPI.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useFeaturedProducts = (
  limit: number = 8,
  options?: UseQueryOptions<Product[], Error>
): UseQueryResult<Product[], Error> => {
  return useQuery<Product[], Error>({
    queryKey: [...PRODUCTS_QUERY_KEYS.featured(), limit] as const,
    queryFn: () => productAPI.getFeaturedProducts(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Product>) => productAPI.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) =>
      productAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['homepage', 'featuredProducts'] });
      queryClient.invalidateQueries({ queryKey: ['homepage', 'sliders'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productAPI.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
    },
  });
};

export const useUpdateProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { isActive?: boolean; isFeatured?: boolean } }) =>
      productAPI.updateProductStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
    },
  });
};
