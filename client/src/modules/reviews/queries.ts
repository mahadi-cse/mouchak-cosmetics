import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewAPI, ReviewSummary, ReviewEligibility } from './api';
import { useSession } from 'next-auth/react';

export const REVIEW_KEYS = {
  summary: (productId: number) => ['reviews', 'summary', productId] as const,
  eligibility: (productId: number) => ['reviews', 'eligibility', productId] as const,
};

/** Fetch all approved reviews + summary stats for a product (public) */
export const useProductReviews = (productId: number) =>
  useQuery<ReviewSummary>({
    queryKey: REVIEW_KEYS.summary(productId),
    queryFn: () => reviewAPI.getProductReviews(productId),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000,
  });

/** Check if the logged-in customer can leave a review and if they already did */
export const useReviewEligibility = (productId: number) => {
  const { status } = useSession();
  return useQuery<ReviewEligibility>({
    queryKey: REVIEW_KEYS.eligibility(productId),
    queryFn: () => reviewAPI.getEligibility(productId),
    enabled: !!productId && status === 'authenticated',
    staleTime: 60 * 1000,
  });
};

export const useCreateReview = (productId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; title?: string; body?: string }) =>
      reviewAPI.createReview(productId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REVIEW_KEYS.summary(productId) });
      qc.invalidateQueries({ queryKey: REVIEW_KEYS.eligibility(productId) });
    },
  });
};

export const useUpdateReview = (productId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating?: number; title?: string; body?: string }) =>
      reviewAPI.updateReview(productId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REVIEW_KEYS.summary(productId) });
      qc.invalidateQueries({ queryKey: REVIEW_KEYS.eligibility(productId) });
    },
  });
};

export const useDeleteReview = (productId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => reviewAPI.deleteReview(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REVIEW_KEYS.summary(productId) });
      qc.invalidateQueries({ queryKey: REVIEW_KEYS.eligibility(productId) });
    },
  });
};
