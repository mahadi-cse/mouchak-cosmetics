import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionsAPI } from './api';
import type { Promotion } from './types';

export const PROMOTION_KEYS = {
  all: ['promotions'] as const,
  list: () => [...PROMOTION_KEYS.all, 'list'] as const,
  active: () => [...PROMOTION_KEYS.all, 'active'] as const,
  product: (slug: string) => [...PROMOTION_KEYS.all, 'product', slug] as const,
};

/** Public hook — fetch the active promotion for homepage display */
export const useActivePromotion = () =>
  useQuery<Promotion | null>({
    queryKey: PROMOTION_KEYS.active(),
    queryFn: promotionsAPI.getActive,
    staleTime: 5 * 60 * 1000,
  });

/** Public hook — fetch promotion for a specific product */
export const useProductPromotion = (slug: string) =>
  useQuery<Promotion | null>({
    queryKey: PROMOTION_KEYS.product(slug),
    queryFn: () => promotionsAPI.getForProduct(slug),
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });

/** Public hook — fetch all active promotions (for bulk card discount calculation) */
export const useActivePromotions = () =>
  useQuery<Promotion[]>({
    queryKey: [...PROMOTION_KEYS.all, 'active-all'] as const,
    queryFn: promotionsAPI.getActiveAll,
    staleTime: 5 * 60 * 1000,
  });

/** Dashboard hook — fetch all promotions */
export const usePromotions = () =>
  useQuery<Promotion[]>({
    queryKey: PROMOTION_KEYS.list(),
    queryFn: promotionsAPI.list,
  });

/** Create promotion mutation */
export const useCreatePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promotionsAPI.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMOTION_KEYS.all }),
  });
};

/** Update promotion mutation */
export const useUpdatePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Parameters<typeof promotionsAPI.update>[1]) =>
      promotionsAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMOTION_KEYS.all }),
  });
};

/** Toggle promotion active state */
export const useTogglePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promotionsAPI.toggle,
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMOTION_KEYS.all }),
  });
};

/** Delete promotion mutation */
export const useDeletePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promotionsAPI.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMOTION_KEYS.all }),
  });
};
