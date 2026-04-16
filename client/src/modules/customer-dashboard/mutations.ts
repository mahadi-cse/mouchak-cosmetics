import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerDashboardAPI } from './api';
import { CUSTOMER_DASHBOARD_QUERY_KEYS } from './queries';
import type { AddWishlistPayload, UpdateProfilePayload } from './types';

export const useUpdateCustomerDashboardProfile = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => customerDashboardAPI.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_DASHBOARD_QUERY_KEYS.profile() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_DASHBOARD_QUERY_KEYS.summary() });
    },
    ...options,
  });
};

export const useAddCustomerWishlistItem = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddWishlistPayload) => customerDashboardAPI.addWishlistItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_DASHBOARD_QUERY_KEYS.wishlist() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_DASHBOARD_QUERY_KEYS.summary() });
    },
    ...options,
  });
};

export const useRemoveCustomerWishlistItem = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => customerDashboardAPI.removeWishlistItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_DASHBOARD_QUERY_KEYS.wishlist() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_DASHBOARD_QUERY_KEYS.summary() });
    },
    ...options,
  });
};
