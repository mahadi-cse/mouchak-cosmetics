import { RequestHandler } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ok, paginate } from '../../shared/utils/apiResponse';
import { ValidationError } from '../../shared/utils/AppError';
import manualSaleService from './manualSale.service';
import { createManualSaleSchema } from './manualSale.schema';

export const createManualSale: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = createManualSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid manual sale payload');
  }

  const result = await manualSaleService.createManualSale(parsed.data);
  res.status(201).json(ok(result, 'Manual sale recorded successfully'));
});

export const listManualSales: RequestHandler = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, sortOrder } = req.query;
  const result = await manualSaleService.listManualSales({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    search: search ? String(search) : undefined,
    sortBy: sortBy ? String(sortBy) as 'createdAt' | 'totalAmount' | 'totalQty' | 'saleNumber' : undefined,
    sortOrder: sortOrder ? String(sortOrder) as 'asc' | 'desc' : undefined,
  });

  res.json(paginate(result.data, result.total, result.page, result.limit));
});

export default {
  createManualSale,
  listManualSales,
};
