import { Router } from 'express';
import * as controller from './coupon.controller';

const router = Router();

// Public — validate a coupon code during checkout
router.post('/validate', controller.validateCoupon);

// Dashboard — CRUD
router.get('/', controller.listCoupons);
router.get('/:id', controller.getCoupon);
router.post('/', controller.createCoupon);
router.put('/:id', controller.updateCoupon);
router.patch('/:id/toggle', controller.toggleCoupon);
router.delete('/:id', controller.deleteCoupon);

export default router;
