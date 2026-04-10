import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { customersAPI, type ListCustomersParams } from './api';
import type { Customer } from '@/shared/types';

export const CUSTOMERS_QUERY_KEYS = {
  all: ['customers'] as const,
  lists: () => [...CUSTOMERS_QUERY_KEYS.all, 'list'] as const,
  list: (params: ListCustomersParams) => [...CUSTOMERS_QUERY_KEYS.lists(), params] as const,
  details: () => [...CUSTOMERS_QUERY_KEYS.all, 'detail'] as const,
  detail: (customerId: number) => [...CUSTOMERS_QUERY_KEYS.details(), customerId] as const,
  orders: (customerId: number) => [...CUSTOMERS_QUERY_KEYS.detail(customerId), 'orders'] as const,
  metrics: (customerId: number) => [...CUSTOMERS_QUERY_KEYS.detail(customerId), 'metrics'] as const,
};

export const useListCustomers = (
  params?: ListCustomersParams,
  options?: any
): UseQueryResult<Customer[], any> => {
  return useQuery<Customer[], any>({
    queryKey: CUSTOMERS_QUERY_KEYS.list(params || {}),
    queryFn: () => customersAPI.listCustomers(params).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useCustomerDetails = (customerId?: number, options?: any): UseQueryResult<Customer, any> => {
  return useQuery<Customer, any>({
    queryKey: CUSTOMERS_QUERY_KEYS.detail(customerId || 0),
    queryFn: () => customersAPI.getCustomerDetails(customerId!),
    enabled: !!customerId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
};

export const useCustomerOrders = (
  customerId?: number,
  params?: { page?: number; limit?: number; status?: string },
  options?: any
) => {
  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEYS.orders(customerId || 0), params],
    queryFn: () => customersAPI.getCustomerOrders(customerId!, params),
    enabled: !!customerId,
    staleTime: 3 * 60 * 1000,
    ...options,
  });
};

export const useCustomerMetrics = (customerId?: number, options?: any) => {
  return useQuery({
    queryKey: CUSTOMERS_QUERY_KEYS.metrics(customerId || 0),
    queryFn: () => customersAPI.getCustomerMetrics(customerId!),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useCustomersBySegment = (
  segment: string,
  params?: Omit<ListCustomersParams, 'segment'>,
  options?: any
) => {
  return useQuery({
    queryKey: CUSTOMERS_QUERY_KEYS.list({ ...params, segment } as ListCustomersParams),
    queryFn: () => customersAPI.listCustomers({ ...params, segment }).then(res => res.data),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};
