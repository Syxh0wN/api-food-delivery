import { Router } from 'express';
import {
  createDeliveryTracking,
  updateDeliveryStatus,
  getOrderTracking,
  getTrackingByCode,
  calculateDeliveryEstimate,
  createDeliveryPerson,
  updateDeliveryPerson,
  getDeliveryPersons,
  getDeliveryStats,
  getOrderImprovementStats,
  getDeliveries
} from '../controllers/deliveryController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';

const router = Router();

router.post('/tracking', authenticate, createDeliveryTracking);

router.put('/tracking/:trackingId/status', authenticate, updateDeliveryStatus);

router.get('/tracking/order/:orderId', authenticate, getOrderTracking);

router.get('/tracking/code/:trackingCode', getTrackingByCode);

router.get('/estimate/:orderId', authenticate, calculateDeliveryEstimate);

router.post('/persons', authenticate, authorize(['ADMIN']), createDeliveryPerson);

router.put('/persons/:deliveryPersonId', authenticate, authorize(['ADMIN']), updateDeliveryPerson);

router.get('/persons', authenticate, authorize(['ADMIN']), getDeliveryPersons);

router.get('/stats', authenticate, authorize(['ADMIN']), getDeliveryStats);

router.get('/improvement-stats', authenticate, authorize(['ADMIN']), getOrderImprovementStats);

router.get('/', authenticate, getDeliveries);

export default router;
