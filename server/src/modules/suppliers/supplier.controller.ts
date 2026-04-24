import { RequestHandler } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ok, paginate } from '../../shared/utils/apiResponse';
import { ValidationError } from '../../shared/utils/AppError';
import supplierService from './supplier.service';
import { createSupplierSchema, updateSupplierSchema, createSupplierTransactionSchema } from './supplier.schema';

export const createSupplier: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = createSupplierSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid supplier data');
  const result = await supplierService.createSupplier(parsed.data);
  res.status(201).json(ok(result, 'Supplier created'));
});

export const updateSupplier: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = updateSupplierSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid data');
  const result = await supplierService.updateSupplier(Number(req.params.id), parsed.data);
  res.json(ok(result, 'Supplier updated'));
});

export const deleteSupplier: RequestHandler = asyncHandler(async (req, res) => {
  await supplierService.deleteSupplier(Number(req.params.id));
  res.json(ok(null, 'Supplier deleted'));
});

export const listSuppliers: RequestHandler = asyncHandler(async (req, res) => {
  const { page, limit, search, includeInactive } = req.query;
  const result = await supplierService.listSuppliers({ page: page ? Number(page) : 1, limit: limit ? Number(limit) : 50, search: search ? String(search) : undefined, includeInactive: includeInactive === 'true' });
  res.json(paginate(result.data, result.total, result.page, result.limit));
});

export const getSupplier: RequestHandler = asyncHandler(async (req, res) => {
  const result = await supplierService.getSupplier(Number(req.params.id));
  res.json(ok(result));
});

export const createTransaction: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = createSupplierTransactionSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid transaction data');
  const result = await supplierService.createTransaction(parsed.data);
  res.status(201).json(ok(result, 'Transaction recorded'));
});

export const listTransactions: RequestHandler = asyncHandler(async (req, res) => {
  const { supplierId, page, limit, search, sortOrder } = req.query;
  const result = await supplierService.listTransactions({ supplierId: supplierId ? Number(supplierId) : undefined, page: page ? Number(page) : 1, limit: limit ? Number(limit) : 20, search: search ? String(search) : undefined, sortOrder: sortOrder as 'asc' | 'desc' | undefined });
  res.json(paginate(result.data, result.total, result.page, result.limit));
});
