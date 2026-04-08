import { useQuery, UseQueryResult, UseQueryOptions } from '@tanstack/react-query';
import { productAPI } from './api';
import { Product, PaginatedResponse, ListProductsParams } from '@/entities/types';

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
  options?: UseQueryOptions<PaginatedResponse<Product[]>, Error, Product[]>
): UseQueryResult<Product[], Error> => {
  return useQuery<PaginatedResponse<Product[]>, Error, Product[]>({
    queryKey: PRODUCTS_QUERY_KEYS.list(params || {}),
    queryFn: () => productAPI.listProducts(params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useProductBySlug = (slug: string, options?: any) => {
  return useQuery({
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
