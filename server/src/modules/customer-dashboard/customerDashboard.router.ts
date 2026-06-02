import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/authenticate';
import * as customerDashboardController from './customerDashboard.controller';
import { USER_TYPE_CODES } from '../../shared/types/auth.types';

const router = Router();

router.use(authenticate, authorize(USER_TYPE_CODES.CUSTOMER));

router.get('/summary', customerDashboardController.getMySummary);
router.get('/profile', customerDashboardController.getMyProfile);
router.patch('/profile', customerDashboardController.updateMyProfile);

router.get('/orders', customerDashboardController.listMyOrders);
router.get('/orders/:orderId/tracking', customerDashboardController.getMyOrderTracking);

router.get('/wishlist', customerDashboardController.listMyWishlist);
router.post('/wishlist', customerDashboardController.addMyWishlistItem);
router.delete('/wishlist/:productId', customerDashboardController.removeMyWishlistItem);

router.get('/returns', customerDashboardController.listMyReturns);
router.post('/returns', customerDashboardController.createMyReturnRequest);

export default router;