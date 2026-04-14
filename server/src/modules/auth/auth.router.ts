import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimiter';
import { allowRoles, authMiddleware } from '../../middleware/authenticate';
import { USER_TYPE_CODES } from '../../shared/types/auth.types';
import * as authController from './auth.controller';

const router = Router();

router.post('/login', authLimiter, authController.login);
router.post('/register', authLimiter, authController.register);
router.post('/google', authLimiter, authController.googleSignIn);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Example protected routes
router.get('/me', authMiddleware, authController.me);
router.get('/profile', authMiddleware, authController.profile);
router.patch('/profile', authMiddleware, authController.updateProfile);
router.get(
  '/admin-health',
  authMiddleware,
  allowRoles(USER_TYPE_CODES.SYSTEM_ADMIN),
  authController.adminOnlyHealth
);

export default router;
