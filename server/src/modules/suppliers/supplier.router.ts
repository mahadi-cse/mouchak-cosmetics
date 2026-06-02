import { Router } from 'express';
import * as c from './supplier.controller';
import { authenticate, authorize } from '../../middleware/authenticate';
import { USER_TYPE_CODES } from '../../shared/types/auth.types';

const router = Router();

router.get('/', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), c.listSuppliers);
router.post('/', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), c.createSupplier);
router.get('/transactions', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), c.listTransactions);
router.post('/transactions', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), c.createTransaction);
router.get('/:id', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), c.getSupplier);
router.put('/:id', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), c.updateSupplier);
router.delete('/:id', authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER, USER_TYPE_CODES.SALES_STAFF, USER_TYPE_CODES.CASHIER), c.deleteSupplier);

export default router;
