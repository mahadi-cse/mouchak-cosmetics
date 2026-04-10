import { Router } from 'express';
import * as manualSaleController from './manualSale.controller';
import { authenticate, authorize } from '../../middleware/authenticate';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'STAFF'), manualSaleController.listManualSales);
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), manualSaleController.createManualSale);

export default router;
