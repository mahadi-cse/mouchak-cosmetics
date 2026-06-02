import { Router } from 'express';
import * as customerController from './customer.controller';
import { authenticate, authorize } from '../../middleware/authenticate';
import { USER_TYPE_CODES } from '../../shared/types/auth.types';

const router = Router();

// Protected routes - ADMIN/STAFF can manage customers
router.get('/', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), customerController.listCustomers);
router.get('/:id', authenticate, customerController.getCustomerDetails);
router.put('/:id', authenticate, customerController.updateCustomer);
router.get('/:id/orders', authenticate, customerController.getCustomerOrders);
router.get('/:id/metrics', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), customerController.getCustomerMetrics);
router.put('/:id/loyalty', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), customerController.updateLoyaltyPoints);
router.delete('/:id', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN), customerController.deleteCustomer);

export default router;
