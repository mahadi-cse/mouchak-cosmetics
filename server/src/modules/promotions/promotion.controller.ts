import { RequestHandler } from 'express';
import { prisma } from '../../config/database';
import { ok } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { cacheGet, cacheSet, cacheDel, TTL } from '../../shared/utils/cache';

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

/** GET /api/promotions — dashboard, returns all promotions */
export const listPromotions: RequestHandler = asyncHandler(async (_req, res) => {
  const promotions = await prisma.promotion.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  res.json(ok(promotions));
});

/** POST /api/promotions — create a new promotion */
export const createPromotion: RequestHandler = asyncHandler(async (req, res) => {
  const { label, banner, pct, endsAt, isActive } = req.body;

  // If this one should be active, deactivate all others first
  if (isActive) {
    await prisma.promotion.updateMany({ data: { isActive: false } });
  }

  const promotion = await prisma.promotion.create({
    data: {
      label,
      banner,
      pct: Number(pct),
      endsAt: endsAt || null,
      isActive: Boolean(isActive),
    },
  });

  await cacheDel(PROMOTION_KEY);
  res.status(201).json(ok(promotion, 'Promotion created'));
});

/** PUT /api/promotions/:id — update an existing promotion */
export const updatePromotion: RequestHandler = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { label, banner, pct, endsAt, isActive } = req.body;

  // If activating this one, deactivate all others first
  if (isActive) {
    await prisma.promotion.updateMany({
      where: { id: { not: id } },
      data: { isActive: false },
    });
  }

  const promotion = await prisma.promotion.update({
    where: { id },
    data: {
      ...(label !== undefined && { label }),
      ...(banner !== undefined && { banner }),
      ...(pct !== undefined && { pct: Number(pct) }),
      ...(endsAt !== undefined && { endsAt: endsAt || null }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    },
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
