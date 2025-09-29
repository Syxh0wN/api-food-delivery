import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { asyncAuthenticatedHandler } from '../middleware/asyncHandler';
import {
  createOrder,
  getUserOrders,
  getStoreOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderSummary
} from '../controllers/orderController';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdSchema,
  storeIdSchema,
  storeOrderIdSchema,
  paginationQuerySchema
} from '../schemas/orderSchemas';

const router = Router();

router.use(authenticate);

router.post('/', validateBody(createOrderSchema), asyncAuthenticatedHandler(createOrder));
router.get('/', asyncAuthenticatedHandler(getUserOrders));
router.get('/:id', asyncAuthenticatedHandler(getOrderById));
router.patch('/:id/cancel', validateParams(orderIdSchema), asyncAuthenticatedHandler(cancelOrder));


export default router;
