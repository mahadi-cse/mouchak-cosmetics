import { RequestHandler } from 'express';
import couponService from './coupon.service';
import { ok, paginate } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ValidationError } from '../../shared/utils/AppError';
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from './coupon.schema';

/** POST /api/coupons — create a new coupon */
export const createCoupon: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = createCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid coupon payload');
  }

  const coupon = await couponService.createCoupon(parsed.data);
  res.status(201).json(ok(coupon, 'Coupon created'));
});

/** GET /api/coupons — list all coupons (dashboard) */
export const listCoupons: RequestHandler = asyncHandler(async (req, res) => {
  const { page, limit, isActive } = req.query;

  const result = await couponService.listCoupons({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 50,
    isActive: isActive !== undefined ? isActive === 'true' : undefined,
  });

  res.json(paginate(result.data, result.total, result.page, result.limit));
});

/** GET /api/coupons/:id — get single coupon */
export const getCoupon: RequestHandler = asyncHandler(async (req, res) => {
  const coupon = await couponService.getCoupon(Number(req.params.id));
  res.json(ok(coupon));
});

/** PUT /api/coupons/:id — update a coupon */
export const updateCoupon: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = updateCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid coupon payload');
  }

  const coupon = await couponService.updateCoupon(Number(req.params.id), parsed.data);
  res.json(ok(coupon, 'Coupon updated'));
});

/** PATCH /api/coupons/:id/toggle — toggle active state */
export const toggleCoupon: RequestHandler = asyncHandler(async (req, res) => {
  const coupon = await couponService.toggleCoupon(Number(req.params.id));
  res.json(ok(coupon, coupon.isActive ? 'Coupon activated' : 'Coupon deactivated'));
});

/** DELETE /api/coupons/:id — delete a coupon */
export const deleteCoupon: RequestHandler = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(Number(req.params.id));
  res.json(ok(null, 'Coupon deleted'));
});

/** POST /api/coupons/validate — validate a coupon code for checkout */
export const validateCoupon: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = validateCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid coupon validation payload');
  }

  const result = await couponService.validateCoupon(parsed.data);
  res.json(ok(result, 'Coupon is valid'));
});
