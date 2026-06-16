import { RequestHandler } from 'express';
import reviewService from './review.service';
import { ok } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { prisma } from '../../config/database';

// ─────────────────────────────────────────────────────────────
// GET /api/reviews/product/:productId   (public)
// ─────────────────────────────────────────────────────────────

export const getProductReviews: RequestHandler = asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId);
  const result = await reviewService.getProductReviews(productId);
  res.json(ok(result));
});

// ─────────────────────────────────────────────────────────────
// GET /api/reviews/product/:productId/eligibility  (customer)
// ─────────────────────────────────────────────────────────────

export const getEligibility: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const productId = Number(req.params.productId);

  const customer = await prisma.customer.findUnique({ where: { userId }, select: { id: true } });
  if (!customer) return res.status(403).json({ success: false, error: 'Customer profile not found' });

  const data = await reviewService.getReviewEligibility(customer.id, productId);
  res.json(ok(data));
});

// ─────────────────────────────────────────────────────────────
// POST /api/reviews/product/:productId  (customer)
// ─────────────────────────────────────────────────────────────

export const createReview: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const productId = Number(req.params.productId);
  const { rating, title, body } = req.body;

  if (!rating) return res.status(400).json({ success: false, error: 'Rating is required' });

  const customer = await prisma.customer.findUnique({ where: { userId }, select: { id: true } });
  if (!customer) return res.status(403).json({ success: false, error: 'Customer profile not found' });

  const review = await reviewService.createReview({ productId, customerId: customer.id, rating: Number(rating), title, body });
  res.status(201).json(ok(review, 'Review submitted successfully'));
});

// ─────────────────────────────────────────────────────────────
// PUT /api/reviews/product/:productId  (customer)
// ─────────────────────────────────────────────────────────────

export const updateReview: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const productId = Number(req.params.productId);
  const { rating, title, body } = req.body;

  const customer = await prisma.customer.findUnique({ where: { userId }, select: { id: true } });
  if (!customer) return res.status(403).json({ success: false, error: 'Customer profile not found' });

  const updated = await reviewService.updateReview(customer.id, productId, { rating: rating ? Number(rating) : undefined, title, body });
  res.json(ok(updated, 'Review updated successfully'));
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/reviews/product/:productId  (customer)
// ─────────────────────────────────────────────────────────────

export const deleteReview: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const productId = Number(req.params.productId);

  const customer = await prisma.customer.findUnique({ where: { userId }, select: { id: true } });
  if (!customer) return res.status(403).json({ success: false, error: 'Customer profile not found' });

  await reviewService.deleteReview(customer.id, productId);
  res.json(ok(null, 'Review deleted successfully'));
});

export default { getProductReviews, getEligibility, createReview, updateReview, deleteReview };
