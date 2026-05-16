import { Router } from 'express';
import * as inventoryController from './inventory.controller';
import { authenticate, authorize } from '../../middleware/authenticate';

const router = Router();

// Protected routes - Only Staff/Admin can view internal inventory details
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), inventoryController.getInventorySummary);
router.get('/low-stock', authenticate, authorize('ADMIN', 'STAFF'), inventoryController.getLowStockItems);
router.get('/reports', authenticate, authorize('ADMIN', 'STAFF'), inventoryController.getInventoryReports);
router.get('/:productId', authenticate, authorize('ADMIN', 'STAFF'), inventoryController.getProductStockDetails);
router.get('/:productId/history', authenticate, authorize('ADMIN', 'STAFF'), inventoryController.getInventoryHistory);

// Protected routes - ADMIN/STAFF
router.post('/adjust', authenticate, authorize('ADMIN', 'STAFF'), inventoryController.adjustStock);
router.post('/transfer', authenticate, authorize('ADMIN', 'STAFF'), inventoryController.transferStock);
router.post('/reconcile', authenticate, authorize('ADMIN'), inventoryController.reconcileStock);

export default router;
