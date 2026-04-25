import { RequestHandler } from 'express';
import { ok, paginate } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { UnauthorizedError, ValidationError } from '../../shared/utils/AppError';
import customerDashboardService from './customerDashboard.service';
import {
  listMyOrdersSchema,
  orderIdParamSchema,
  updateMyProfileSchema,
  wishlistItemSchema,
  wishlistProductParamSchema,
} from './customerDashboard.schema';

const requireUserId = (req: Parameters<RequestHandler>[0]): number => {
  if (!req.user?.id) {
    throw new UnauthorizedError('Unauthorized', 'UNAUTHORIZED');
  }

  return req.user.id;
};

export const getMySummary: RequestHandler = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const data = await customerDashboardService.getSummary(userId);
  res.json(ok(data));
});

export const getMyProfile: RequestHandler = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const profile = await customerDashboardService.getProfile(userId);
  res.json(ok(profile));
});

export const updateMyProfile: RequestHandler = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const parsed = updateMyProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid profile payload');
  }

  const profile = await customerDashboardService.updateProfile(userId, parsed.data);
  res.json(ok(profile, 'Profile updated successfully'));
});

export const listMyOrders: RequestHandler = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const parsed = listMyOrdersSchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid orders query');
  }

  const result = await customerDashboardService.listOrders(userId, parsed.data);
  res.json(paginate(result.data, result.total, result.page, result.limit));
});

export const getMyOrderTracking: RequestHandler = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const parsed = orderIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid order id');
  }

  const tracking = await customerDashboardService.getOrderTracking(userId, parsed.data.orderId);
  res.json(ok(tracking));
});

export const listMyWishlist: RequestHandler = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const wishlist = await customerDashboardService.listWishlist(userId);
  res.json(ok(wishlist));
});

export const addMyWishlistItem: RequestHandler = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const parsed = wishlistItemSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid wishlist payload');
  }

  const item = await customerDashboardService.addWishlistItem(userId, parsed.data.productId);
  res.status(201).json(ok(item, 'Added to wishlist'));
});

export const removeMyWishlistItem: RequestHandler = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const parsed = wishlistProductParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid product id');
  }

  const result = await customerDashboardService.removeWishlistItem(userId, parsed.data.productId);
  res.json(ok(result, 'Wishlist item removed'));
});

export default {
  getMySummary,
  getMyProfile,
  updateMyProfile,
  listMyOrders,
  getMyOrderTracking,
  listMyWishlist,
  addMyWishlistItem,
  removeMyWishlistItem,
};