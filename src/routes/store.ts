import { Router } from 'express';
import { 
  createStore,
  getStoreById,
  getMyStores,
  getAllStores,
  updateStore,
  deleteStore,
  toggleStoreStatus
} from '../controllers/storeController';
import {
  getStoreOrders,
  updateOrderStatus,
  getOrderSummary
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';
import { cacheStoreMiddleware } from '../middleware/cache';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { asyncAuthenticatedHandler } from '../middleware/asyncHandler';
import {
  updateOrderStatusSchema,
  storeIdSchema,
  storeOrderIdSchema,
  paginationQuerySchema
} from '../schemas/orderSchemas';

const router = Router();

// Rotas públicas
router.get('/stores', cacheStoreMiddleware, getAllStores);
router.get('/stores/:id', cacheStoreMiddleware, getStoreById);

// Rotas para donos de loja
router.post('/stores', authenticate, authorize(['STORE_OWNER']), createStore);
router.get('/stores/my', authenticate, authorize(['STORE_OWNER']), getMyStores);
router.put('/stores/:id', authenticate, authorize(['STORE_OWNER']), updateStore);
router.delete('/stores/:id', authenticate, authorize(['STORE_OWNER']), deleteStore);
router.patch('/stores/:id/toggle', authenticate, authorize(['STORE_OWNER']), toggleStoreStatus);

// Rotas de pedidos para donos de loja
router.get('/stores/:storeId/orders', authenticate, authorize(['STORE_OWNER']), validateParams(storeIdSchema), asyncAuthenticatedHandler(getStoreOrders));
router.patch('/stores/:storeId/orders/:id/status', authenticate, authorize(['STORE_OWNER']), validateParams(storeOrderIdSchema), validateBody(updateOrderStatusSchema), asyncAuthenticatedHandler(updateOrderStatus));
router.get('/stores/:storeId/orders/summary', authenticate, authorize(['STORE_OWNER']), validateParams(storeIdSchema), asyncAuthenticatedHandler(getOrderSummary));

export default router;
