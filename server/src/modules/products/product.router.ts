import { Router } from 'express';
import * as productController from './product.controller';

const router = Router();

// Public routes
router.get('/', productController.listProducts);
router.get('/:slug', productController.getProductBySlug);

export default router;
