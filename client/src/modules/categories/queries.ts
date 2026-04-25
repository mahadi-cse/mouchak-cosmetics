import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { categoryAPI } from './api';
import { Category } from '@/shared/types';

type ListCategoriesOptions = Partial<UseQueryOptions<Category[], Error>>;
type CategoryBySlugOptions = Partial<UseQueryOptions<Category, Error>>;

export const CATEGORIES_QUERY_KEYS = {
  all: ['categories'] as const,
  lists: () => [...CATEGORIES_QUERY_KEYS.all, 'list'] as const,
  list: () => [...CATEGORIES_QUERY_KEYS.lists()] as const,
  details: () => [...CATEGORIES_QUERY_KEYS.all, 'detail'] as const,
  detail: (slug: string) => [...CATEGORIES_QUERY_KEYS.details(), slug] as const,
};

export const useListCategories = (
  params?: { branchId?: number; includeInactive?: boolean },
  options?: ListCategoriesOptions
) => {
  return useQuery<Category[], Error>({
    queryKey: [...CATEGORIES_QUERY_KEYS.list(), params].filter(Boolean),
    queryFn: () => categoryAPI.listCategories(params),
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

export const useCategoryBySlug = (slug: string, options?: CategoryBySlugOptions) => {
  return useQuery<Category, Error>({
    queryKey: CATEGORIES_QUERY_KEYS.detail(slug),
    queryFn: () => categoryAPI.getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Category>) => categoryAPI.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.all });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      categoryAPI.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.all });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoryAPI.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.all });
    },
  });
};

export const useUpdateCategoryStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { isActive?: boolean } }) =>
      categoryAPI.updateCategoryStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.all });
    },
  });
};
