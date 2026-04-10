import { RequestHandler } from 'express';
import inventoryService from './inventory.service';
import { ok, paginate } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const getInventorySummary: RequestHandler = asyncHandler(async (req, res) => {
  const { page, limit, warehouseId, lowStockOnly } = req.query;

  const result = await inventoryService.getInventorySummary({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
    lowStockOnly: lowStockOnly === 'true',
  });

  res.json(paginate(result.data, result.total, result.page, result.limit));
});

export const getProductStockDetails: RequestHandler = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const result = await inventoryService.getProductStockDetails(Number(productId));
  res.json(ok(result));
});

export const adjustStock: RequestHandler = asyncHandler(async (req, res) => {
  const transaction = await inventoryService.adjustStock(req.body);
  res.status(201).json(ok(transaction, 'Stock adjusted successfully'));
});

export const transferStock: RequestHandler = asyncHandler(async (req, res) => {
  const transfer = await inventoryService.transferStock(req.body);
  res.status(201).json(ok(transfer, 'Stock transfer initiated'));
});

export const getLowStockItems: RequestHandler = asyncHandler(async (req, res) => {
  const { page, limit, warehouseId } = req.query;

  const result = await inventoryService.getLowStockItems({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
  });

  res.json(paginate(result.data, result.total, result.page, result.limit));
});

export const getInventoryHistory: RequestHandler = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page, limit, startDate, endDate, type } = req.query;

  const result = await inventoryService.getInventoryHistory(Number(productId), {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    startDate: startDate as string,
    endDate: endDate as string,
    type: type as string,
  });

  res.json(paginate(result.data, result.total, result.page, result.limit));
});

export const reconcileStock: RequestHandler = asyncHandler(async (req, res) => {
  const result = await inventoryService.reconcileStock(req.body);
  res.json(ok(result, 'Stock reconciliation completed'));
});

export const getInventoryReports: RequestHandler = asyncHandler(async (req, res) => {
  const { reportType, startDate, endDate, warehouseId } = req.query;

  const result = await inventoryService.getInventoryReports({
    reportType: reportType as 'summary' | 'detailed' | 'valuation',
    startDate: startDate as string,
    endDate: endDate as string,
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
  });

  res.json(ok(result));
});

export default {
  getInventorySummary,
  getProductStockDetails,
  adjustStock,
  transferStock,
  getLowStockItems,
  getInventoryHistory,
  reconcileStock,
  getInventoryReports,
};
