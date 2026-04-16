import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { customerDashboardAPI } from './api';
import type {
  CustomerDashboardOrdersResult,
  CustomerDashboardProfile,
  CustomerDashboardSummary,
  CustomerOrderTracking,
  ListMyOrdersParams,
  WishlistItem,
} from './types';

export const CUSTOMER_DASHBOARD_QUERY_KEYS = {
  all: ['customer-dashboard'] as const,
  summary: () => [...CUSTOMER_DASHBOARD_QUERY_KEYS.all, 'summary'] as const,
  profile: () => [...CUSTOMER_DASHBOARD_QUERY_KEYS.all, 'profile'] as const,
  orders: (params: ListMyOrdersParams) =>
    [...CUSTOMER_DASHBOARD_QUERY_KEYS.all, 'orders', params] as const,
  tracking: (orderId?: number) =>
    [...CUSTOMER_DASHBOARD_QUERY_KEYS.all, 'tracking', orderId || 0] as const,
  wishlist: () => [...CUSTOMER_DASHBOARD_QUERY_KEYS.all, 'wishlist'] as const,
};

export const useCustomerDashboardSummary = (
  options?: any
): UseQueryResult<CustomerDashboardSummary, Error> => {
  return useQuery<CustomerDashboardSummary, Error>({
    queryKey: CUSTOMER_DASHBOARD_QUERY_KEYS.summary(),
    queryFn: () => customerDashboardAPI.getSummary(),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

export const useCustomerDashboardProfile = (
  options?: any
): UseQueryResult<CustomerDashboardProfile, Error> => {
  return useQuery<CustomerDashboardProfile, Error>({
    queryKey: CUSTOMER_DASHBOARD_QUERY_KEYS.profile(),
    queryFn: () => customerDashboardAPI.getProfile(),
    staleTime: 3 * 60 * 1000,
    ...options,
  });
};

export const useCustomerDashboardOrders = (
  params?: ListMyOrdersParams,
  options?: any
): UseQueryResult<CustomerDashboardOrdersResult, Error> => {
  return useQuery<CustomerDashboardOrdersResult, Error>({
    queryKey: CUSTOMER_DASHBOARD_QUERY_KEYS.orders(params || {}),
    queryFn: () => customerDashboardAPI.listOrders(params),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useCustomerOrderTracking = (
  orderId?: number,
  options?: any
): UseQueryResult<CustomerOrderTracking, Error> => {
  return useQuery<CustomerOrderTracking, Error>({
    queryKey: CUSTOMER_DASHBOARD_QUERY_KEYS.tracking(orderId),
    queryFn: () => customerDashboardAPI.getOrderTracking(orderId!),
    enabled: !!orderId,
    staleTime: 30 * 1000,
    ...options,
  });
};

export const useCustomerWishlist = (
  options?: any
): UseQueryResult<WishlistItem[], Error> => {
  return useQuery<WishlistItem[], Error>({
    queryKey: CUSTOMER_DASHBOARD_QUERY_KEYS.wishlist(),
    queryFn: () => customerDashboardAPI.listWishlist(),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};
