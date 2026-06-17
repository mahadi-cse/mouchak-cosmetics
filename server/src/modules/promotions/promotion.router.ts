import { Router } from 'express';
import * as controller from './promotion.controller';

const router = Router();

// Public — get the active promotion (for homepage)
router.get('/active', controller.getActivePromotion);

// Public — get all active promotions (for bulk product card discount calculation)
router.get('/active-all', controller.getActivePromotions);

// Public — get promotion for a specific product by slug
router.get('/product/:slug', controller.getPromotionForProduct);

// Dashboard — list all promotions
router.get('/', controller.listPromotions);

// Dashboard — CRUD
router.post('/', controller.createPromotion);
router.put('/:id', controller.updatePromotion);
router.patch('/:id/toggle', controller.togglePromotion);
router.delete('/:id', controller.deletePromotion);

export default router;
