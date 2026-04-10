import { useQuery } from '@tanstack/react-query';
import { manualSalesAPI, type ListManualSalesParams, type ManualSaleResponse } from './api';
import type { PaginatedResponse } from '@/shared/types';

export const MANUAL_SALES_QUERY_KEYS = {
  all: ['manual-sales'] as const,
  lists: () => [...MANUAL_SALES_QUERY_KEYS.all, 'list'] as const,
  list: (params: ListManualSalesParams) => [...MANUAL_SALES_QUERY_KEYS.lists(), params] as const,
};

export const useListManualSales = (params?: ListManualSalesParams, options?: any) => {
  return useQuery<PaginatedResponse<ManualSaleResponse>, any>({
    queryKey: MANUAL_SALES_QUERY_KEYS.list(params || {}),
    queryFn: () => manualSalesAPI.listManualSales(params),
    staleTime: 60 * 1000,
    ...options,
  });
};
