import { Router } from 'express';
import * as customerController from './customer.controller';
import { authenticate, authorize } from '../../middleware/authenticate';

const router = Router();

// Protected routes - ADMIN/STAFF can manage customers
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), customerController.listCustomers);
router.get('/:id', authenticate, customerController.getCustomerDetails);
router.put('/:id', authenticate, customerController.updateCustomer);
router.get('/:id/orders', authenticate, customerController.getCustomerOrders);
router.get('/:id/metrics', authenticate, authorize('ADMIN', 'STAFF'), customerController.getCustomerMetrics);
router.put('/:id/loyalty', authenticate, authorize('ADMIN', 'STAFF'), customerController.updateLoyaltyPoints);
router.delete('/:id', authenticate, authorize('ADMIN'), customerController.deleteCustomer);

export default router;
