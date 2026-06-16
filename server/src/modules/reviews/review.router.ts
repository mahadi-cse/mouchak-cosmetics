import { Router } from 'express';
import * as reviewController from './review.controller';
import { authenticate, authorize } from '../../middleware/authenticate';
import { USER_TYPE_CODES } from '../../shared/types/auth.types';

const router = Router();

// Public — anyone can read reviews
router.get('/product/:productId', reviewController.getProductReviews);

// Customer only — check eligibility before showing the form
router.get(
  '/product/:productId/eligibility',
  authenticate,
  authorize(USER_TYPE_CODES.CUSTOMER),
  reviewController.getEligibility,
);

// Customer only — submit, edit, delete their review
router.post(
  '/product/:productId',
  authenticate,
  authorize(USER_TYPE_CODES.CUSTOMER),
  reviewController.createReview,
);

router.put(
  '/product/:productId',
  authenticate,
  authorize(USER_TYPE_CODES.CUSTOMER),
  reviewController.updateReview,
);

router.delete(
  '/product/:productId',
  authenticate,
  authorize(USER_TYPE_CODES.CUSTOMER),
  reviewController.deleteReview,
);

export default router;
