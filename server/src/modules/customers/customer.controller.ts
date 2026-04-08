import { RequestHandler } from 'express';
import customerService from './customer.service';
import { ok, paginate } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const listCustomers: RequestHandler = asyncHandler(async (req, res) => {
  const { page, limit, search, segment } = req.query;

  const result = await customerService.listCustomers({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    search: search as string,
    segment: segment as string,
  });

  res.json(paginate(result.data, result.total, result.page, result.limit));
});

export const getCustomerDetails: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = await customerService.getCustomerDetails(Number(id));
  res.json(ok(customer));
});

export const updateCustomer: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = await customerService.updateCustomer(Number(id), req.body);
  res.json(ok(customer, 'Customer updated successfully'));
});

export const getCustomerOrders: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit, status } = req.query;

  const result = await customerService.getCustomerOrders(Number(id), {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    status: status as string,
  });

  res.json(paginate(result.data, result.total, result.page, result.limit));
});

export const updateLoyaltyPoints: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = await customerService.updateLoyaltyPoints(Number(id), req.body);
  res.json(ok(customer, 'Loyalty points updated'));
});

export const deleteCustomer: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await customerService.deleteCustomer(Number(id));
  res.status(204).json(ok(result));
});

export const getCustomerMetrics: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const metrics = await customerService.getCustomerMetrics(Number(id));
  res.json(ok(metrics));
});

export default {
  listCustomers,
  getCustomerDetails,
  updateCustomer,
  getCustomerOrders,
  updateLoyaltyPoints,
  deleteCustomer,
  getCustomerMetrics,
};
