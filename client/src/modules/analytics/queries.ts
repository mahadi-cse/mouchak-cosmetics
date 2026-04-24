import { useQuery } from '@tanstack/react-query';
import {
  analyticsAPI,
  type AnalyticsParams,
  type OverviewMetrics,
  type OverviewPeriod,
} from './api';

export const ANALYTICS_QUERY_KEYS = {
  all: ['analytics'] as const,
  revenue: () => [...ANALYTICS_QUERY_KEYS.all, 'revenue'] as const,
  revenueWithParams: (params: AnalyticsParams) =>
    [...ANALYTICS_QUERY_KEYS.revenue(), params] as const,
  salesByCategory: () => [...ANALYTICS_QUERY_KEYS.all, 'salesByCategory'] as const,
  salesByCategoryWithParams: (params: AnalyticsParams) =>
    [...ANALYTICS_QUERY_KEYS.salesByCategory(), params] as const,
  topProducts: () => [...ANALYTICS_QUERY_KEYS.all, 'topProducts'] as const,
  topProductsWithParams: (params: AnalyticsParams & { limit?: number }) =>
    [...ANALYTICS_QUERY_KEYS.topProducts(), params] as const,
  customers: () => [...ANALYTICS_QUERY_KEYS.all, 'customers'] as const,
  customersWithParams: (params: AnalyticsParams) =>
    [...ANALYTICS_QUERY_KEYS.customers(), params] as const,
  invoices: () => [...ANALYTICS_QUERY_KEYS.all, 'invoices'] as const,
  invoicesWithParams: (params: AnalyticsParams) =>
    [...ANALYTICS_QUERY_KEYS.invoices(), params] as const,
  overview: () => [...ANALYTICS_QUERY_KEYS.all, 'overview'] as const,
  overviewWithParams: (params: { period?: OverviewPeriod; warehouseId?: number }) =>
    [...ANALYTICS_QUERY_KEYS.overview(), params] as const,
  custom: () => [...ANALYTICS_QUERY_KEYS.all, 'custom'] as const,
  customWithParams: (query: any) => [...ANALYTICS_QUERY_KEYS.custom(), query] as const,
};

export const useRevenueAnalytics = (params?: AnalyticsParams, options?: any) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.revenueWithParams(params || {}),
    queryFn: () => analyticsAPI.getRevenueAnalytics(params),
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

export const useSalesByCategory = (params?: AnalyticsParams, options?: any) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.salesByCategoryWithParams(params || {}),
    queryFn: () => analyticsAPI.getSalesByCategory(params),
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

export const useTopProducts = (
  params?: AnalyticsParams & { limit?: number },
  options?: any
) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.topProductsWithParams(params || {}),
    queryFn: () => analyticsAPI.getTopProducts(params),
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

export const useCustomerAnalytics = (params?: AnalyticsParams, options?: any) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.customersWithParams(params || {}),
    queryFn: () => analyticsAPI.getCustomerAnalytics(params),
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

export const useInvoiceData = (params?: AnalyticsParams, options?: any) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.invoicesWithParams(params || {}),
    queryFn: () => analyticsAPI.getInvoiceData(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useOverviewMetrics = (
  params?: { period?: OverviewPeriod; warehouseId?: number; startDate?: string; endDate?: string },
  options?: any
) => {
  return useQuery<OverviewMetrics, Error>({
    queryKey: ANALYTICS_QUERY_KEYS.overviewWithParams(params || {}),
    queryFn: () => analyticsAPI.getOverviewMetrics(params),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useCustomReport = (query: any, options?: any) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.customWithParams(query),
    queryFn: () => analyticsAPI.getCustomReport(query),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Dashboard-specific hooks for common queries
export const useDashboardMetrics = (params?: AnalyticsParams) => {
  const revenue = useRevenueAnalytics(params, { staleTime: 10 * 60 * 1000 });
  const customers = useCustomerAnalytics(params, { staleTime: 10 * 60 * 1000 });
  const topProducts = useTopProducts({ ...params, limit: 5 }, { staleTime: 10 * 60 * 1000 });
  const salesByCategory = useSalesByCategory(params, { staleTime: 10 * 60 * 1000 });

  return {
    revenue,
    customers,
    topProducts,
    salesByCategory,
    isLoading:
      revenue.isLoading ||
      customers.isLoading ||
      topProducts.isLoading ||
      salesByCategory.isLoading,
    isError:
      revenue.isError ||
      customers.isError ||
      topProducts.isError ||
      salesByCategory.isError,
  };
};
