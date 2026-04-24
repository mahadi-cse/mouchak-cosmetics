import { Router } from 'express';
import * as manualReturnController from './manualReturn.controller';
import { authenticate, authorize } from '../../middleware/authenticate';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'STAFF'), manualReturnController.listManualReturns);
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), manualReturnController.createManualReturn);

export default router;
