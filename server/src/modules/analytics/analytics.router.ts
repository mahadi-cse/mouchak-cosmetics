import { Router } from 'express';
import * as analyticsController from './analytics.controller';
import { authenticate, authorize } from '../../middleware/authenticate';

const router = Router();

// Protected routes - ADMIN/STAFF only
router.get('/overview', authenticate, authorize('ADMIN', 'STAFF'), analyticsController.getOverviewMetrics);
router.get('/revenue', authenticate, authorize('ADMIN', 'STAFF'), analyticsController.getRevenueAnalytics);
router.get('/sales-by-category', authenticate, authorize('ADMIN', 'STAFF'), analyticsController.getSalesByCategory);
router.get('/top-products', authenticate, authorize('ADMIN', 'STAFF'), analyticsController.getTopProducts);
router.get('/customers', authenticate, authorize('ADMIN', 'STAFF'), analyticsController.getCustomerAnalytics);
router.get('/invoices', authenticate, authorize('ADMIN', 'STAFF'), analyticsController.getInvoiceData);
router.get('/custom', authenticate, authorize('ADMIN', 'STAFF'), analyticsController.getCustomReport);

export default router;
