import { prisma } from '../../config/database';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface CreateReviewInput {
  productId: number;
  customerId: number;
  rating: number;       // 1-5
  title?: string;
  body?: string;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Check if the customer has at least one DELIVERED order that contains productId */
async function hasDeliveredPurchase(customerId: number, productId: number): Promise<boolean> {
  const hit = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        customerId,
        status: 'DELIVERED',
      },
    },
    select: { id: true },
  });
  return hit !== null;
}

// ─────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────

const reviewService = {
  /** Get all approved reviews for a product, newest first */
  async getProductReviews(productId: number) {
    const reviews = await prisma.productReview.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Summary stats
    const total = reviews.length;
    const avgRating = total
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
      : 0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

    return { reviews, total, avgRating, distribution };
  },

  /** Check if the logged-in customer can review and if they already have */
  async getReviewEligibility(customerId: number, productId: number) {
    const canReview = await hasDeliveredPurchase(customerId, productId);
    const existing = await prisma.productReview.findUnique({
      where: { customerId_productId: { customerId, productId } },
    });
    return { canReview, hasReviewed: !!existing, existingReview: existing ?? null };
  },

  /** Create a new review — only allowed if customer has a delivered purchase */
  async createReview(input: CreateReviewInput) {
    const { productId, customerId, rating, title, body } = input;

    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

    const eligible = await hasDeliveredPurchase(customerId, productId);
    if (!eligible) {
      throw Object.assign(new Error('You can only review products you have purchased and received'), { status: 403 });
    }

    const existing = await prisma.productReview.findUnique({
      where: { customerId_productId: { customerId, productId } },
    });
    if (existing) {
      throw Object.assign(new Error('You have already reviewed this product'), { status: 409 });
    }

    const review = await prisma.productReview.create({
      data: { productId, customerId, rating, title, body, isVerified: true, isApproved: true },
      include: { customer: { select: { firstName: true, lastName: true } } },
    });

    // Update cached avg rating on product_analytics (upsert)
    const agg = await prisma.productReview.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { id: true },
    });
    await prisma.productAnalytics.upsert({
      where: { productId },
      create: {
        productId,
        avgRating: agg._avg.rating ?? 0,
        reviewCount: agg._count.id,
      },
      update: {
        avgRating: agg._avg.rating ?? 0,
        reviewCount: agg._count.id,
      },
    });

    return review;
  },

  /** Update the customer's own review */
  async updateReview(customerId: number, productId: number, data: { rating?: number; title?: string; body?: string }) {
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const existing = await prisma.productReview.findUnique({
      where: { customerId_productId: { customerId, productId } },
    });
    if (!existing) throw Object.assign(new Error('Review not found'), { status: 404 });

    const updated = await prisma.productReview.update({
      where: { customerId_productId: { customerId, productId } },
      data,
      include: { customer: { select: { firstName: true, lastName: true } } },
    });

    // Refresh analytics
    const agg = await prisma.productReview.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { id: true },
    });
    await prisma.productAnalytics.upsert({
      where: { productId },
      create: { productId, avgRating: agg._avg.rating ?? 0, reviewCount: agg._count.id },
      update: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count.id },
    });

    return updated;
  },

  /** Delete the customer's own review */
  async deleteReview(customerId: number, productId: number) {
    const existing = await prisma.productReview.findUnique({
      where: { customerId_productId: { customerId, productId } },
    });
    if (!existing) throw Object.assign(new Error('Review not found'), { status: 404 });

    await prisma.productReview.delete({
      where: { customerId_productId: { customerId, productId } },
    });

    // Refresh analytics
    const agg = await prisma.productReview.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { id: true },
    });
    await prisma.productAnalytics.upsert({
      where: { productId },
      create: { productId, avgRating: agg._avg.rating ?? 0, reviewCount: agg._count.id },
      update: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count.id },
    });
  },
};

export default reviewService;
