import apiClient from '@/shared/lib/apiClient';
import type { Coupon, ValidateCouponRequest, ValidateCouponResponse } from './types';

export const couponsAPI = {
  /** Public — validate a coupon code during checkout */
  validate: async (data: ValidateCouponRequest): Promise<ValidateCouponResponse> => {
    const res = await apiClient.post<{ data: ValidateCouponResponse }>('/coupons/validate', data);
    return res.data.data;
  },

  /** Dashboard — list all coupons */
  list: async (params?: { page?: number; limit?: number; isActive?: boolean }): Promise<Coupon[]> => {
    const res = await apiClient.get<{ data: Coupon[] }>('/coupons', {
      params: {
        ...(params?.page && { page: params.page }),
        ...(params?.limit && { limit: params.limit }),
        ...(params?.isActive !== undefined && { isActive: params.isActive }),
      },
    });
    return res.data.data;
  },

  /** Dashboard — get single coupon */
  get: async (id: number): Promise<Coupon> => {
    const res = await apiClient.get<{ data: Coupon }>(`/coupons/${id}`);
    return res.data.data;
  },

  /** Dashboard — create a new coupon */
  create: async (data: {
    code: string;
    description?: string;
    type: 'FIXED' | 'PERCENTAGE';
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    isActive?: boolean;
    startsAt?: string;
    expiresAt?: string;
  }): Promise<Coupon> => {
    const res = await apiClient.post<{ data: Coupon }>('/coupons', data);
    return res.data.data;
  },

  /** Dashboard — update an existing coupon */
  update: async (id: number, data: Partial<{
    code: string;
    description: string;
    type: 'FIXED' | 'PERCENTAGE';
    value: number;
    minOrderAmount: number | null;
    maxDiscountAmount: number | null;
    usageLimit: number | null;
    isActive: boolean;
    startsAt: string | null;
    expiresAt: string | null;
  }>): Promise<Coupon> => {
    const res = await apiClient.put<{ data: Coupon }>(`/coupons/${id}`, data);
    return res.data.data;
  },

  /** Dashboard — toggle active state */
  toggle: async (id: number): Promise<Coupon> => {
    const res = await apiClient.patch<{ data: Coupon }>(`/coupons/${id}/toggle`);
    return res.data.data;
  },

  /** Dashboard — delete a coupon */
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/coupons/${id}`);
  },
};
