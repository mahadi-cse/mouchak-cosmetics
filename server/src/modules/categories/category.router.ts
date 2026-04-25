import { Router } from 'express';
import * as categoryController from './category.controller';
import { authenticate, authorize } from '../../middleware/authenticate';

const router = Router();

// Public routes
router.get('/', categoryController.listCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

// Protected routes - ADMIN
router.post('/', authenticate, authorize('ADMIN'), categoryController.createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), categoryController.updateCategory);
router.patch('/:id/status', authenticate, authorize('ADMIN'), categoryController.updateCategoryStatus);
router.delete('/:id', authenticate, authorize('ADMIN'), categoryController.deleteCategory);

export default router;
