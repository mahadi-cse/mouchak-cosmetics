import { Router } from 'express';
import * as productController from './product.controller';
import { authenticate, authorize } from '../../middleware/authenticate';

const router = Router();

// Public routes
router.get('/', productController.listProducts);
router.get('/:slug', productController.getProductBySlug);

// Protected routes - ADMIN/STAFF
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), productController.createProduct);
router.post('/bulk', authenticate, authorize('ADMIN'), productController.bulkImportProducts);
router.put('/:id', authenticate, authorize('ADMIN', 'STAFF'), productController.updateProduct);
router.patch('/:id/status', authenticate, authorize('ADMIN'), productController.updateProductStatus);
router.delete('/:id', authenticate, authorize('ADMIN'), productController.deleteProduct);

export default router;
