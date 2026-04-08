import { RequestHandler } from 'express';
import analyticsService from './analytics.service';
import { ok } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const getRevenueAnalytics: RequestHandler = asyncHandler(async (req, res) => {
  const { startDate, endDate, period } = req.query;

  const result = await analyticsService.getRevenueAnalytics({
    startDate: startDate as string,
    endDate: endDate as string,
    period: period as 'day' | 'week' | 'month' | 'year',
  });

  res.json(ok(result));
});

export const getSalesByCategory: RequestHandler = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const result = await analyticsService.getSalesByCategory({
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.json(ok(result));
});

export const getTopProducts: RequestHandler = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit } = req.query;

  const result = await analyticsService.getTopProducts({
    startDate: startDate as string,
    endDate: endDate as string,
    limit: limit ? Number(limit) : 10,
  });

  res.json(ok(result));
});

export const getCustomerAnalytics: RequestHandler = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const result = await analyticsService.getCustomerAnalytics({
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.json(ok(result));
});

export const getInvoiceData: RequestHandler = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const result = await analyticsService.getInvoiceData({
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.json(ok(result));
});

export const getCustomReport: RequestHandler = asyncHandler(async (req, res) => {
  const result = await analyticsService.getCustomReport(req.query);
  res.json(ok(result));
});

export default {
  getRevenueAnalytics,
  getSalesByCategory,
  getTopProducts,
  getCustomerAnalytics,
  getInvoiceData,
  getCustomReport,
};
