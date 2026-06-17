import { Router } from 'express';
import * as analyticsController from './analytics.controller';
import { authenticate, authorize } from '../../middleware/authenticate';
import { USER_TYPE_CODES } from '../../shared/types/auth.types';

const router = Router();

// Protected routes - ADMIN/STAFF only
router.get('/overview', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), analyticsController.getOverviewMetrics);
router.get('/revenue', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), analyticsController.getRevenueAnalytics);
router.get('/sales-by-category', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), analyticsController.getSalesByCategory);
router.get('/top-products', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), analyticsController.getTopProducts);
router.get('/customers', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), analyticsController.getCustomerAnalytics);
router.get('/staff', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), analyticsController.getStaffAnalytics);
router.get('/customers-detailed', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), analyticsController.getCustomersDetailed);
router.get('/invoices', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), analyticsController.getInvoiceData);
router.get('/custom', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), analyticsController.getCustomReport);

export default router;
