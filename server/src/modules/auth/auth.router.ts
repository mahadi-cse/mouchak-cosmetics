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

router.get('/user-types', authMiddleware, allowRoles(USER_TYPE_CODES.SYSTEM_ADMIN), authController.getUserTypes);
router.get('/users', authMiddleware, allowRoles(USER_TYPE_CODES.SYSTEM_ADMIN), authController.getUsers);
router.post('/users', authMiddleware, allowRoles(USER_TYPE_CODES.SYSTEM_ADMIN), authController.createUser);
router.patch('/users/:id', authMiddleware, allowRoles(USER_TYPE_CODES.SYSTEM_ADMIN), authController.updateUser);
router.put('/users/:id/modules', authMiddleware, allowRoles(USER_TYPE_CODES.SYSTEM_ADMIN), authController.updateUserModules);
router.put('/users/:id/branches', authMiddleware, allowRoles(USER_TYPE_CODES.SYSTEM_ADMIN), authController.updateUserBranches);
router.post('/users/:id/force-logout', authMiddleware, allowRoles(USER_TYPE_CODES.SYSTEM_ADMIN), authController.forceLogout);

// Security Devices endpoints
router.get('/security-devices', authMiddleware, authController.getSecurityDevices);
router.post('/security-devices/revoke-all-others', authMiddleware, authController.revokeAllOtherDevices);
router.post('/security-devices/:id/revoke', authMiddleware, authController.revokeDevice);

export default router;
