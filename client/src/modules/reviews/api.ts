import apiClient from '@/shared/lib/apiClient';

export interface ReviewData {
  id: number;
  productId: number;
  customerId: number;
  rating: number;
  title: string | null;
  body: string | null;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  customer: { firstName: string | null; lastName: string | null };
}

export interface ReviewSummary {
  reviews: ReviewData[];
  total: number;
  avgRating: number;
  distribution: Record<number, number>;
}

export interface ReviewEligibility {
  canReview: boolean;
  hasReviewed: boolean;
  existingReview: ReviewData | null;
}

export const reviewAPI = {
  getProductReviews: async (productId: number): Promise<ReviewSummary> => {
    const res = await apiClient.get<{ success: boolean; data: ReviewSummary }>(
      `/reviews/product/${productId}`,
    );
    return res.data.data;
  },

  getEligibility: async (productId: number): Promise<ReviewEligibility> => {
    const res = await apiClient.get<{ success: boolean; data: ReviewEligibility }>(
      `/reviews/product/${productId}/eligibility`,
    );
    return res.data.data;
  },

  createReview: async (
    productId: number,
    payload: { rating: number; title?: string; body?: string },
  ): Promise<ReviewData> => {
    const res = await apiClient.post<{ success: boolean; data: ReviewData }>(
      `/reviews/product/${productId}`,
      payload,
    );
    return res.data.data;
  },

  updateReview: async (
    productId: number,
    payload: { rating?: number; title?: string; body?: string },
  ): Promise<ReviewData> => {
    const res = await apiClient.put<{ success: boolean; data: ReviewData }>(
      `/reviews/product/${productId}`,
      payload,
    );
    return res.data.data;
  },

  deleteReview: async (productId: number): Promise<void> => {
    await apiClient.delete(`/reviews/product/${productId}`);
  },
};
