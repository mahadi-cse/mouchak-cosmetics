import { RequestHandler } from 'express';
import { prisma } from '../../config/database';
import { ok } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ValidationError } from '../../shared/utils/AppError';
import { cacheGet, cacheSet, cacheDel, TTL } from '../../shared/utils/cache';
import { createPromotionSchema, updatePromotionSchema } from './promotion.schema';

const PROMOTION_KEY = 'promotions:active';

/** GET /api/promotions/active — public, returns the single active promotion or null */
export const getActivePromotion: RequestHandler = asyncHandler(async (_req, res) => {
  const cached = await cacheGet<any>(PROMOTION_KEY);
  if (cached !== null) {
    return res.json(ok(cached));
  }

  const promotion = await prisma.promotion.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  });

  await cacheSet(PROMOTION_KEY, promotion, TTL.SHORT);
  res.json(ok(promotion));
});

/** GET /api/promotions/active-all — public, returns all active promotions for bulk card calculation */
export const getActivePromotions: RequestHandler = asyncHandler(async (_req, res) => {
  const promotions = await prisma.promotion.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(ok(promotions));
});

/** GET /api/promotions — dashboard, returns all promotions with category included */
export const listPromotions: RequestHandler = asyncHandler(async (_req, res) => {
  const promotions = await prisma.promotion.findMany({
    include: { category: { select: { id: true, name: true, slug: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(ok(promotions));
});

/** POST /api/promotions — create a new promotion with validation */
export const createPromotion: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = createPromotionSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Invalid promotion payload';
    throw new ValidationError(message);
  }

  const data = parsed.data;

  // Validate category exists if applyTo = CATEGORY
  if (data.applyTo === 'CATEGORY' && data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new ValidationError('Selected category not found');
    }
  }

  // Validate products exist if applyTo = PRODUCT
  if (data.applyTo === 'PRODUCT' && data.productIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: data.productIds } },
      select: { id: true },
    });
    if (products.length !== data.productIds.length) {
      throw new ValidationError('One or more selected products not found');
    }
  }

  // If this one should be active, deactivate all others first
  if (data.isActive) {
    await prisma.promotion.updateMany({ data: { isActive: false } });
  }

  const promotion = await prisma.promotion.create({
    data: {
      label: data.label,
      banner: data.banner,
      pct: data.pct,
      endsAt: data.endsAt || null,
      isActive: data.isActive,
      applyTo: data.applyTo,
      productIds: data.applyTo === 'PRODUCT' ? data.productIds : [],
      categoryId: data.applyTo === 'CATEGORY' ? data.categoryId : null,
    },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  await cacheDel(PROMOTION_KEY);
  res.status(201).json(ok(promotion, 'Promotion created'));
});

/** PUT /api/promotions/:id — update an existing promotion with validation */
export const updatePromotion: RequestHandler = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.promotion.findUnique({ where: { id } });
  if (!existing) {
    throw new ValidationError('Promotion not found');
  }

  const parsed = updatePromotionSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Invalid promotion payload';
    throw new ValidationError(message);
  }

  const data = parsed.data;
  const mergedApplyTo = data.applyTo ?? existing.applyTo;

  // Validate category exists if applyTo = CATEGORY
  const mergedCategoryId = data.categoryId !== undefined ? data.categoryId : existing.categoryId;
  if (mergedApplyTo === 'CATEGORY' && mergedCategoryId) {
    const category = await prisma.category.findUnique({ where: { id: mergedCategoryId } });
    if (!category) {
      throw new ValidationError('Selected category not found');
    }
  }

  // Validate products exist if applyTo = PRODUCT
  const mergedProductIds = data.productIds ?? existing.productIds;
  if (mergedApplyTo === 'PRODUCT' && mergedProductIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: mergedProductIds } },
      select: { id: true },
    });
    if (products.length !== mergedProductIds.length) {
      throw new ValidationError('One or more selected products not found');
    }
  }

  // If activating this one, deactivate all others first
  if (data.isActive) {
    await prisma.promotion.updateMany({
      where: { id: { not: id } },
      data: { isActive: false },
    });
  }

  const promotion = await prisma.promotion.update({
    where: { id },
    data: {
      ...(data.label !== undefined && { label: data.label }),
      ...(data.banner !== undefined && { banner: data.banner }),
      ...(data.pct !== undefined && { pct: data.pct }),
      ...(data.endsAt !== undefined && { endsAt: data.endsAt || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.applyTo !== undefined && { applyTo: data.applyTo }),
      ...(data.productIds !== undefined && {
        productIds: data.applyTo === 'PRODUCT' ? data.productIds : [],
      }),
      ...(data.categoryId !== undefined && {
        categoryId: data.applyTo === 'CATEGORY' ? data.categoryId : null,
      }),
    },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  await cacheDel(PROMOTION_KEY);
  res.json(ok(promotion, 'Promotion updated'));
});

/** PATCH /api/promotions/:id/toggle — toggle active state */
export const togglePromotion: RequestHandler = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const current = await prisma.promotion.findUniqueOrThrow({ where: { id } });
  const shouldActivate = !current.isActive;

  // If activating, deactivate all others
  if (shouldActivate) {
    await prisma.promotion.updateMany({
      where: { id: { not: id } },
      data: { isActive: false },
    });
  }

  const promotion = await prisma.promotion.update({
    where: { id },
    data: { isActive: shouldActivate },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  await cacheDel(PROMOTION_KEY);
  res.json(ok(promotion, shouldActivate ? 'Promotion activated' : 'Promotion paused'));
});

/** DELETE /api/promotions/:id */
export const deletePromotion: RequestHandler = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await prisma.promotion.delete({ where: { id } });
  await cacheDel(PROMOTION_KEY);
  res.json(ok(null, 'Promotion deleted'));
});

/** GET /api/promotions/product/:slug — public, returns promotion info for a specific product */
export const getPromotionForProduct: RequestHandler = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, categoryId: true },
  });

  if (!product) {
    return res.json(ok(null));
  }

  // Find active promotion that applies to this product
  const promotion = await prisma.promotion.findFirst({
    where: {
      isActive: true,
      OR: [
        { applyTo: 'ALL' },
        { applyTo: 'PRODUCT', productIds: { has: product.id } },
        { applyTo: 'CATEGORY', categoryId: product.categoryId },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.json(ok(promotion));
});
