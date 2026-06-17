import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponsAPI } from './api';
import type { Coupon, ValidateCouponRequest, ValidateCouponResponse } from './types';

export const COUPON_KEYS = {
  all: ['coupons'] as const,
  list: () => [...COUPON_KEYS.all, 'list'] as const,
  detail: (id: number) => [...COUPON_KEYS.all, 'detail', id] as const,
  validate: (code: string, subtotal: number) => [...COUPON_KEYS.all, 'validate', code, subtotal] as const,
};

/** Dashboard hook — fetch all coupons */
export const useCoupons = () =>
  useQuery<Coupon[]>({
    queryKey: COUPON_KEYS.list(),
    queryFn: () => couponsAPI.list(),
  });

/** Dashboard hook — fetch single coupon */
export const useCoupon = (id: number) =>
  useQuery<Coupon>({
    queryKey: COUPON_KEYS.detail(id),
    queryFn: () => couponsAPI.get(id),
    enabled: !!id,
  });

/** Create coupon mutation */
export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: couponsAPI.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: COUPON_KEYS.all }),
  });
};

/** Update coupon mutation */
export const useUpdateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Parameters<typeof couponsAPI.update>[1]>) =>
      couponsAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: COUPON_KEYS.all }),
  });
};

/** Toggle coupon active state */
export const useToggleCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: couponsAPI.toggle,
    onSuccess: () => qc.invalidateQueries({ queryKey: COUPON_KEYS.all }),
  });
};

/** Delete coupon mutation */
export const useDeleteCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: couponsAPI.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: COUPON_KEYS.all }),
  });
};

/** Validate coupon for checkout (client-side, no caching) */
export const useValidateCoupon = () => {
  return useMutation<ValidateCouponResponse, Error, ValidateCouponRequest>({
    mutationFn: couponsAPI.validate,
  });
};
