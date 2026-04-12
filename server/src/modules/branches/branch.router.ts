import { Router } from 'express';
import * as branchController from './branch.controller';
import { authenticate, authorize } from '../../middleware/authenticate';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'STAFF'), branchController.listBranches);
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), branchController.createBranch);
router.patch('/:id', authenticate, authorize('ADMIN', 'STAFF'), branchController.updateBranch);
router.patch('/:id/status', authenticate, authorize('ADMIN', 'STAFF'), branchController.toggleBranchStatus);

export default router;
