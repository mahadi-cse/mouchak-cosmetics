import apiClient from '@/shared/lib/apiClient';
import type { ApiResponse } from '@/shared/types';

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  warehouseId?: number;
  period?: 'day' | 'week' | 'month' | 'year';
}

export type OverviewPeriod = 'today' | 'week' | 'month';

export interface RevenueAnalytics {
  period: any;
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  avgOrderValue: number;
  currency: string;
}

export interface SalesByCategory {
  categoryId: number;
  categoryName: string;
  totalSales: number;
  totalItems: number;
  totalRevenue: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  sku: string;
  unitsSold: number;
  revenue: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  avgOrdersPerCustomer: number;
  totalSpent: number;
  avgSpentPerCustomer: number;
  segments: {
    vip: number;
    regular: number;
    new: number;
    inactive: number;
  };
}

export interface OverviewMetrics {
  period: OverviewPeriod;
  range: {
    startDate: string;
    endDate: string;
    comparisonLabel: string;
  };
  manualSales: {
    totalSales: number;
    totalQty: number;
    transactions: number;
    avgTicket: number;
    salesDeltaPercent: number;
    transactionDelta: number;
    avgTicketDelta: number;
  };
  trend: {
    revenue: number[];
    cost: number[];
    transactions: number[];
    avgTicket: number[];
    labels?: string[];
  };
  inventory: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    categoryDistribution: Array<{
      categoryName: string;
      count: number;
    }>;
    alertItems: Array<{
      productId: number;
      productName: string;
      sku: string;
      categoryName: string;
      quantity: number;
      threshold: number;
      status: 'low' | 'out';
    }>;
  };
  salesByCategory: Array<{
    categoryName: string;
    totalRevenue: number;
    totalItems: number;
    sharePercent: number;
  }>;
  topProducts: Array<{
    productId: number;
    productName: string;
    sku: string;
    unitsSold: number;
    revenue: number;
  }>;
}

export const analyticsAPI = {
  getRevenueAnalytics: async (params?: AnalyticsParams) => {
    const response = await apiClient.get<ApiResponse<RevenueAnalytics>>('/analytics/revenue', {
      params,
    });
    return response.data.data;
  },

  getSalesByCategory: async (params?: AnalyticsParams) => {
    const response = await apiClient.get<ApiResponse<SalesByCategory[]>>(
      '/analytics/sales-by-category',
      { params }
    );
    return response.data.data;
  },

  getTopProducts: async (params?: AnalyticsParams & { limit?: number }) => {
    const response = await apiClient.get<ApiResponse<TopProduct[]>>('/analytics/top-products', {
      params,
    });
    return response.data.data;
  },

  getCustomerAnalytics: async (params?: AnalyticsParams) => {
    const response = await apiClient.get<ApiResponse<CustomerAnalytics>>(
      '/analytics/customers',
      { params }
    );
    return response.data.data;
  },

  getInvoiceData: async (params?: AnalyticsParams) => {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/invoices', { params });
    return response.data.data;
  },

  getCustomReport: async (query: any) => {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/custom', { params: query });
    return response.data.data;
  },

  getOverviewMetrics: async (params?: { period?: OverviewPeriod; warehouseId?: number; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get<ApiResponse<OverviewMetrics>>('/analytics/overview', {
      params,
    });
    return response.data.data;
  },
};
