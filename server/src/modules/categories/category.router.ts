import { Router } from 'express';
import * as categoryController from './category.controller';

const router = Router();

// Public routes
router.get('/', categoryController.listCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

export default router;
