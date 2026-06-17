import apiClient from '@/shared/lib/apiClient';
import type { Promotion } from './types';

export const promotionsAPI = {
  /** Public — get the currently active promotion */
  getActive: async (): Promise<Promotion | null> => {
    const res = await apiClient.get<{ data: Promotion | null }>('/promotions/active');
    return res.data.data;
  },

  /** Public — get promotion for a specific product by slug */
  getForProduct: async (slug: string): Promise<Promotion | null> => {
    const res = await apiClient.get<{ data: Promotion | null }>(`/promotions/product/${encodeURIComponent(slug)}`);
    return res.data.data;
  },

  /** Public — get all active promotions (for bulk card calculation) */
  getActiveAll: async (): Promise<Promotion[]> => {
    const res = await apiClient.get<{ data: Promotion[] }>('/promotions/active-all');
    return res.data.data;
  },

  /** Dashboard — list all promotions */
  list: async (): Promise<Promotion[]> => {
    const res = await apiClient.get<{ data: Promotion[] }>('/promotions');
    return res.data.data;
  },

  /** Create a new promotion */
  create: async (data: {
    label: string;
    banner: string;
    pct: number;
    endsAt?: string;
    isActive?: boolean;
    applyTo?: 'ALL' | 'PRODUCT' | 'CATEGORY';
    productIds?: number[];
    categoryId?: number | null;
  }): Promise<Promotion> => {
    const res = await apiClient.post<{ data: Promotion }>('/promotions', data);
    return res.data.data;
  },

  /** Update an existing promotion */
  update: async (id: number, data: Partial<{
    label: string;
    banner: string;
    pct: number;
    endsAt: string;
    isActive: boolean;
    applyTo: 'ALL' | 'PRODUCT' | 'CATEGORY';
    productIds: number[];
    categoryId: number | null;
  }>): Promise<Promotion> => {
    const res = await apiClient.put<{ data: Promotion }>(`/promotions/${id}`, data);
    return res.data.data;
  },

  /** Toggle active state */
  toggle: async (id: number): Promise<Promotion> => {
    const res = await apiClient.patch<{ data: Promotion }>(`/promotions/${id}/toggle`);
    return res.data.data;
  },

  /** Delete a promotion */
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/promotions/${id}`);
  },
};
