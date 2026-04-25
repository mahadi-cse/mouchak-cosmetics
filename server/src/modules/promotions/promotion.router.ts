import { Router } from 'express';
import * as controller from './promotion.controller';

const router = Router();

// Public — get the active promotion (for homepage)
router.get('/active', controller.getActivePromotion);

// Dashboard — list all promotions
router.get('/', controller.listPromotions);

// Dashboard — CRUD
router.post('/', controller.createPromotion);
router.put('/:id', controller.updatePromotion);
router.patch('/:id/toggle', controller.togglePromotion);
router.delete('/:id', controller.deletePromotion);

export default router;
