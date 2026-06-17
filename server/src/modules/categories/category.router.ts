import { Router } from 'express';
import * as categoryController from './category.controller';
import { authenticate, authorize } from '../../middleware/authenticate';
import { USER_TYPE_CODES } from '../../shared/types/auth.types';

const router = Router();

// Public routes
router.get('/', categoryController.listCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

// Protected routes - ADMIN only
router.post('/', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN), categoryController.createCategory);
router.post('/bulk', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN), categoryController.bulkImportCategories);
router.put('/:id', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN), categoryController.updateCategory);
router.patch('/:id/status', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN), categoryController.updateCategoryStatus);
router.delete('/:id', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN), categoryController.deleteCategory);

export default router;
