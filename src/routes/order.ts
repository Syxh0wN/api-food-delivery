import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  createOrder,
  getUserOrders,
  getStoreOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderSummary
} from '../controllers/orderController';

const router = Router();

router.use(authenticate);

router.post('/orders', createOrder);
router.get('/orders', getUserOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/cancel', cancelOrder);

router.use(authorize([UserRole.STORE_OWNER]));
router.get('/stores/:storeId/orders', getStoreOrders);
router.patch('/stores/:storeId/orders/:id/status', updateOrderStatus);
router.get('/stores/:storeId/orders/summary', getOrderSummary);

export default router;
