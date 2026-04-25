import { RequestHandler } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ok, paginate } from '../../shared/utils/apiResponse';
import { ValidationError } from '../../shared/utils/AppError';
import manualReturnService from './manualReturn.service';
import { createManualReturnSchema } from './manualReturn.schema';

export const createManualReturn: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = createManualReturnSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid manual return payload');
  }

  const result = await manualReturnService.createManualReturn(parsed.data);
  res.status(201).json(ok(result, 'Manual return recorded successfully'));
});

export const listManualReturns: RequestHandler = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, sortOrder } = req.query;
  const result = await manualReturnService.listManualReturns({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    search: search ? String(search) : undefined,
    sortBy: sortBy ? String(sortBy) as any : undefined,
    sortOrder: sortOrder ? String(sortOrder) as 'asc' | 'desc' : undefined,
  });

  res.json(paginate(result.data, result.total, result.page, result.limit));
});

export default { createManualReturn, listManualReturns };
