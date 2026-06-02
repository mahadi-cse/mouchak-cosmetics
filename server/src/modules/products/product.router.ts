import { Router } from 'express';
import * as productController from './product.controller';
import { authenticate, authorize } from '../../middleware/authenticate';
import { USER_TYPE_CODES } from '../../shared/types/auth.types';

const router = Router();

// Public routes
router.get('/', productController.listProducts);
router.get('/:slug', productController.getProductBySlug);

// Protected routes - ADMIN/STAFF
router.post('/', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), productController.createProduct);
router.post('/bulk', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN), productController.bulkImportProducts);
router.put('/:id', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), productController.updateProduct);
router.patch('/:id/status', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN), productController.updateProductStatus);
router.delete('/:id', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN), productController.deleteProduct);

export default router;
