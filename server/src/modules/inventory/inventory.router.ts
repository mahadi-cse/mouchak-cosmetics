import { Router } from 'express';
import * as inventoryController from './inventory.controller';
import { authenticate, authorize } from '../../middleware/authenticate';

const router = Router();

// Public routes - Customers can view
router.get('/', authenticate, inventoryController.getInventorySummary);
router.get('/low-stock', authenticate, inventoryController.getLowStockItems);
router.get('/reports', authenticate, authorize('ADMIN', 'STAFF'), inventoryController.getInventoryReports);
router.get('/:productId', authenticate, inventoryController.getProductStockDetails);
router.get('/:productId/history', authenticate, inventoryController.getInventoryHistory);

// Protected routes - ADMIN/STAFF
router.post('/adjust', authenticate, authorize('ADMIN', 'STAFF'), inventoryController.adjustStock);
router.post('/transfer', authenticate, authorize('ADMIN', 'STAFF'), inventoryController.transferStock);
router.post('/reconcile', authenticate, authorize('ADMIN'), inventoryController.reconcileStock);

export default router;
