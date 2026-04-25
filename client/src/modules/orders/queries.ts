import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { ordersAPI, type ListOrdersParams } from './api';
import type { Order } from '@/shared/types';

export const ORDERS_QUERY_KEYS = {
  all: ['orders'] as const,
  lists: () => [...ORDERS_QUERY_KEYS.all, 'list'] as const,
  list: (params: ListOrdersParams) => [...ORDERS_QUERY_KEYS.lists(), params] as const,
  details: () => [...ORDERS_QUERY_KEYS.all, 'detail'] as const,
  detail: (orderId: number) => [...ORDERS_QUERY_KEYS.details(), orderId] as const,
  invoices: () => [...ORDERS_QUERY_KEYS.all, 'invoice'] as const,
  invoice: (orderId: number) => [...ORDERS_QUERY_KEYS.invoices(), orderId] as const,
};

export const useListOrders = (
  params?: ListOrdersParams,
  options?: any
): UseQueryResult<Order[], any> => {
  return useQuery<Order[], any>({
    queryKey: ORDERS_QUERY_KEYS.list(params || {}),
    queryFn: () => ordersAPI.listOrders(params).then(res => res.data),
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
};

export const useOrderDetails = (orderId?: number, options?: any): UseQueryResult<Order, any> => {
  return useQuery<Order, any>({
    queryKey: ORDERS_QUERY_KEYS.detail(orderId || 0),
    queryFn: () => ordersAPI.getOrderDetails(orderId!),
    enabled: !!orderId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useOrderInvoice = (orderId?: number, options?: any) => {
  return useQuery({
    queryKey: ORDERS_QUERY_KEYS.invoice(orderId || 0),
    queryFn: () => ordersAPI.generateInvoice(orderId!),
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useOrdersByCustomer = (
  customerId?: number,
  options?: any
) => {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEYS.lists(), { customerId }],
    queryFn: () => ordersAPI.listOrders({ customerId }).then(res => res.data),
    enabled: !!customerId,
    staleTime: 3 * 60 * 1000,
    ...options,
  });
};

export const useOrdersByStatus = (
  status: string,
  params?: Omit<ListOrdersParams, 'status'>,
  options?: any
) => {
  return useQuery({
    queryKey: ORDERS_QUERY_KEYS.list({ ...params, status } as ListOrdersParams),
    queryFn: () => ordersAPI.listOrders({ ...params, status }).then(res => res.data),
    staleTime: 3 * 60 * 1000,
    ...options,
  });
};
