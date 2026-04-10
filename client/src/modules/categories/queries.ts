import { useQuery } from '@tanstack/react-query';
import { categoryAPI } from './api';
import { Category } from '@/shared/types';

export const CATEGORIES_QUERY_KEYS = {
  all: ['categories'] as const,
  lists: () => [...CATEGORIES_QUERY_KEYS.all, 'list'] as const,
  list: () => [...CATEGORIES_QUERY_KEYS.lists()] as const,
  details: () => [...CATEGORIES_QUERY_KEYS.all, 'detail'] as const,
  detail: (slug: string) => [...CATEGORIES_QUERY_KEYS.details(), slug] as const,
};

export const useListCategories = (options?: any) => {
  return useQuery<Category[], Error>({
    queryKey: CATEGORIES_QUERY_KEYS.list(),
    queryFn: () => categoryAPI.listCategories(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

export const useCategoryBySlug = (slug: string, options?: any) => {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEYS.detail(slug),
    queryFn: () => categoryAPI.getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};
