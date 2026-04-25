import { useQuery } from '@tanstack/react-query';
import { manualReturnsAPI, type ListManualReturnsParams, type ManualReturnResponse } from './api';
import type { PaginatedResponse } from '@/shared/types';

export const MANUAL_RETURNS_QUERY_KEYS = {
  all: ['manual-returns'] as const,
  lists: () => [...MANUAL_RETURNS_QUERY_KEYS.all, 'list'] as const,
  list: (params: ListManualReturnsParams) => [...MANUAL_RETURNS_QUERY_KEYS.lists(), params] as const,
};

export const useListManualReturns = (params?: ListManualReturnsParams, options?: any) => {
  return useQuery<PaginatedResponse<ManualReturnResponse>, any>({
    queryKey: MANUAL_RETURNS_QUERY_KEYS.list(params || {}),
    queryFn: () => manualReturnsAPI.listManualReturns(params),
    staleTime: 60 * 1000,
    ...options,
  });
};
