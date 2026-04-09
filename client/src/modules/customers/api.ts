import apiClient from '@/shared/lib/apiClient';
import type { Customer, PaginatedResponse, ApiResponse } from '@/entities/types';

export interface ListCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  segment?: string;
}

export interface UpdateCustomerRequest {
  dateOfBirth?: string;
  gender?: string;
  defaultAddress?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface UpdateLoyaltyPointsRequest {
  points: number;
  action: 'ADD' | 'SUBTRACT' | 'SET';
  reason?: string;
}

export const customersAPI = {
  listCustomers: async (params?: ListCustomersParams) => {
    const response = await apiClient.get<PaginatedResponse<Customer[]>>('/customers', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        ...(params?.search && { search: params.search }),
        ...(params?.segment && { segment: params.segment }),
      },
    });
    return response.data;
  },

  getCustomerDetails: async (customerId: number) => {
    const response = await apiClient.get<ApiResponse<Customer>>(`/customers/${customerId}`);
    return response.data.data;
  },

  updateCustomer: async (customerId: number, data: UpdateCustomerRequest) => {
    const response = await apiClient.put<ApiResponse<Customer>>(`/customers/${customerId}`, data);
    return response.data.data;
  },

  getCustomerOrders: async (
    customerId: number,
    params?: { page?: number; limit?: number; status?: string }
  ) => {
    const response = await apiClient.get<PaginatedResponse<any>>(`/customers/${customerId}/orders`, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        ...(params?.status && { status: params.status }),
      },
    });
    return response.data;
  },

  getCustomerMetrics: async (customerId: number) => {
    const response = await apiClient.get<ApiResponse<any>>(`/customers/${customerId}/metrics`);
    return response.data.data;
  },

  updateLoyaltyPoints: async (customerId: number, data: UpdateLoyaltyPointsRequest) => {
    const response = await apiClient.put<ApiResponse<Customer>>(
      `/customers/${customerId}/loyalty`,
      data
    );
    return response.data.data;
  },

  deleteCustomer: async (customerId: number) => {
    const response = await apiClient.delete<ApiResponse<any>>(`/customers/${customerId}`);
    return response.data;
  },
};
