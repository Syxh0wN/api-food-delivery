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
  createStoreSchema,
  updateStoreSchema,
  storeIdSchema
} from '../schemas/storeSchemas';
import {
  updateOrderStatusSchema,
  storeOrderIdSchema,
  paginationQuerySchema
} from '../schemas/orderSchemas';

const router = Router();

// Rotas públicas
router.get('/stores', cacheStoreMiddleware, asyncAuthenticatedHandler(getAllStores));
router.get('/stores/:id', validateParams(storeIdSchema), cacheStoreMiddleware, asyncAuthenticatedHandler(getStoreById));

// Rotas para donos de loja
router.post('/stores', authenticate, authorize(['STORE_OWNER']), validateBody(createStoreSchema), asyncAuthenticatedHandler(createStore));
router.get('/stores/my', authenticate, authorize(['STORE_OWNER']), asyncAuthenticatedHandler(getMyStores));
router.put('/stores/:id', authenticate, authorize(['STORE_OWNER']), validateParams(storeIdSchema), validateBody(updateStoreSchema), asyncAuthenticatedHandler(updateStore));
router.delete('/stores/:id', authenticate, authorize(['STORE_OWNER']), validateParams(storeIdSchema), asyncAuthenticatedHandler(deleteStore));
router.patch('/stores/:id/toggle', authenticate, authorize(['STORE_OWNER']), validateParams(storeIdSchema), asyncAuthenticatedHandler(toggleStoreStatus));

// Rotas de pedidos para donos de loja
router.get('/stores/:storeId/orders', authenticate, authorize(['STORE_OWNER']), validateParams(storeIdSchema), asyncAuthenticatedHandler(getStoreOrders));
router.patch('/stores/:storeId/orders/:id/status', authenticate, authorize(['STORE_OWNER']), validateParams(storeOrderIdSchema), validateBody(updateOrderStatusSchema), asyncAuthenticatedHandler(updateOrderStatus));
router.get('/stores/:storeId/orders/summary', authenticate, authorize(['STORE_OWNER']), validateParams(storeIdSchema), asyncAuthenticatedHandler(getOrderSummary));

export default router;
