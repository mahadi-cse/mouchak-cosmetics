import apiClient from '@/shared/lib/apiClient';
import type { Order, PaginatedResponse, ApiResponse } from '@/shared/types';

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  channel?: 'ONLINE' | 'POS';
  customerId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CreateOrderRequest {
  customerId?: number;
  channel?: 'ONLINE' | 'POS';
  items: Array<{ productId: number; quantity: number }>;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostal?: string;
  shippingCountry?: string;
  discountAmount?: number;
  shippingCharge?: number;
  taxAmount?: number;
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
}

export interface CreateReturnRequest {
  orderItemId: number;
  reason: string;
  returnedQuantity: number;
  notes?: string;
}

export interface ProcessRefundRequest {
  returnId: number;
  refundAmount: number;
}

export const ordersAPI = {
  listOrders: async (params?: ListOrdersParams) => {
    const response = await apiClient.get<PaginatedResponse<Order[]>>('/orders', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        ...(params?.status && { status: params.status }),
        ...(params?.channel && { channel: params.channel }),
        ...(params?.customerId && { customerId: params.customerId }),
        ...(params?.startDate && { startDate: params.startDate }),
        ...(params?.endDate && { endDate: params.endDate }),
        ...(params?.search && { search: params.search }),
      },
    });
    return response.data;
  },

  getOrderDetails: async (orderId: number) => {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return response.data.data;
  },

  createOrder: async (data: CreateOrderRequest) => {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', data);
    return response.data.data;
  },

  updateOrder: async (orderId: number, data: any) => {
    const response = await apiClient.put<ApiResponse<Order>>(`/orders/${orderId}`, data);
    return response.data.data;
  },

  updateOrderStatus: async (orderId: number, data: UpdateOrderStatusRequest) => {
    const response = await apiClient.put<ApiResponse<Order>>(`/orders/${orderId}/status`, data);
    return response.data.data;
  },

  addOrderNotes: async (orderId: number, notes: string) => {
    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${orderId}/notes`, { notes });
    return response.data.data;
  },

  createReturn: async (data: CreateReturnRequest) => {
    const response = await apiClient.post<ApiResponse<any>>('/orders/return', data);
    return response.data.data;
  },

  processRefund: async (data: ProcessRefundRequest) => {
    const response = await apiClient.put<ApiResponse<any>>('/orders/refund', data);
    return response.data.data;
  },

  markAsShipped: async (orderId: number) => {
    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${orderId}/ship`, {});
    return response.data.data;
  },

  generateInvoice: async (orderId: number) => {
    const response = await apiClient.get<ApiResponse<any>>(`/orders/${orderId}/invoice`);
    return response.data.data;
  },

  cancelOrder: async (orderId: number) => {
    const response = await apiClient.delete<ApiResponse<Order>>(`/orders/${orderId}`);
    return response.data.data;
  },
};
