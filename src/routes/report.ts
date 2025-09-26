import { Router } from 'express';
import {
  getSalesReport,
  getOrderReport,
  getUserReport,
  getStoreReport,
  getProductReport,
  getDashboardReport,
  exportReport
} from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/sales', getSalesReport);
router.get('/orders', getOrderReport);
router.get('/users', getUserReport);
router.get('/stores', getStoreReport);
router.get('/products', getProductReport);
router.get('/dashboard', getDashboardReport);

router.post('/export/:reportType', exportReport);

export default router;
