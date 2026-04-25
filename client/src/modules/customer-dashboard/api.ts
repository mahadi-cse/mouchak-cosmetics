import apiClient from '@/shared/lib/apiClient';
import type {
  AddWishlistPayload,
  CustomerDashboardOrder,
  CustomerDashboardProfile,
  CustomerDashboardSummary,
  CustomerOrderTracking,
  ListMyOrdersParams,
  PaginationMeta,
  UpdateProfilePayload,
  WishlistItem,
} from './types';

type ApiOk<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type ApiPaginated<T> = {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
};

export const customerDashboardAPI = {
  getSummary: async () => {
    const response = await apiClient.get<ApiOk<CustomerDashboardSummary>>('/customer-dashboard/summary');
    return response.data.data;
  },

  getProfile: async () => {
    const response = await apiClient.get<ApiOk<CustomerDashboardProfile>>('/customer-dashboard/profile');
    return response.data.data;
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const response = await apiClient.patch<ApiOk<CustomerDashboardProfile>>(
      '/customer-dashboard/profile',
      payload
    );
    return response.data.data;
  },

  listOrders: async (params?: ListMyOrdersParams) => {
    const response = await apiClient.get<ApiPaginated<CustomerDashboardOrder>>('/customer-dashboard/orders', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.search ? { search: params.search } : {}),
      },
    });

    return {
      orders: response.data.data,
      meta: response.data.meta,
    };
  },

  getOrderTracking: async (orderId: number) => {
    const response = await apiClient.get<ApiOk<CustomerOrderTracking>>(
      `/customer-dashboard/orders/${orderId}/tracking`
    );
    return response.data.data;
  },

  listWishlist: async () => {
    const response = await apiClient.get<ApiOk<WishlistItem[]>>('/customer-dashboard/wishlist');
    return response.data.data;
  },

  addWishlistItem: async (payload: AddWishlistPayload) => {
    const response = await apiClient.post<ApiOk<WishlistItem>>('/customer-dashboard/wishlist', payload);
    return response.data.data;
  },

  removeWishlistItem: async (productId: number) => {
    const response = await apiClient.delete<ApiOk<{ removed: boolean; productId: number }>>(
      `/customer-dashboard/wishlist/${productId}`
    );
    return response.data.data;
  },
};
