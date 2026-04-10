import { Router } from 'express';
import * as orderController from './order.controller';
import { authenticate, authorize } from '../../middleware/authenticate';

const router = Router();

// Protected routes - All require auth
router.get('/', authenticate, orderController.listOrders);
router.post('/', authenticate, orderController.createOrder);
router.get('/:id', authenticate, orderController.getOrderDetails);
router.put('/:id', authenticate, orderController.updateOrder);
router.put('/:id/status', authenticate, authorize('ADMIN', 'STAFF'), orderController.updateOrderStatus);
router.post('/:id/notes', authenticate, authorize('ADMIN', 'STAFF'), orderController.addOrderNotes);
router.post('/:id/return', authenticate, orderController.createReturn);
router.put('/:id/refund', authenticate, authorize('ADMIN'), orderController.processRefund);
router.post('/:id/ship', authenticate, authorize('ADMIN', 'STAFF'), orderController.markAsShipped);
router.get('/:id/invoice', authenticate, orderController.generateInvoice);
router.delete('/:id', authenticate, authorize('ADMIN', 'STAFF'), orderController.cancelOrder);

export default router;
