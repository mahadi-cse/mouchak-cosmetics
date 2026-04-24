import { Router } from 'express';
import * as c from './supplier.controller';
import { authenticate, authorize } from '../../middleware/authenticate';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'STAFF'), c.listSuppliers);
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), c.createSupplier);
router.get('/transactions', authenticate, authorize('ADMIN', 'STAFF'), c.listTransactions);
router.post('/transactions', authenticate, authorize('ADMIN', 'STAFF'), c.createTransaction);
router.get('/:id', authenticate, authorize('ADMIN', 'STAFF'), c.getSupplier);
router.put('/:id', authenticate, authorize('ADMIN', 'STAFF'), c.updateSupplier);
router.delete('/:id', authenticate, authorize('ADMIN', 'STAFF'), c.deleteSupplier);

export default router;
