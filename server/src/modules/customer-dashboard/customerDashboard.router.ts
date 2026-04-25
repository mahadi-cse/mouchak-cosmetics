import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/authenticate';
import * as customerDashboardController from './customerDashboard.controller';

const router = Router();

router.use(authenticate, authorize('CUSTOMER'));

router.get('/summary', customerDashboardController.getMySummary);
router.get('/profile', customerDashboardController.getMyProfile);
router.patch('/profile', customerDashboardController.updateMyProfile);

router.get('/orders', customerDashboardController.listMyOrders);
router.get('/orders/:orderId/tracking', customerDashboardController.getMyOrderTracking);

router.get('/wishlist', customerDashboardController.listMyWishlist);
router.post('/wishlist', customerDashboardController.addMyWishlistItem);
router.delete('/wishlist/:productId', customerDashboardController.removeMyWishlistItem);

export default router;