import { Router } from 'express';
import { 
  createPaymentIntent, 
  confirmPayment, 
  createRefund, 
  getPaymentStatus,
  handleWebhook 
} from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { validateBody, validateParams } from '../middleware/validation';
import { asyncAuthenticatedHandler, asyncHandler } from '../middleware/asyncHandler';
import {
  createPaymentIntentSchema,
  refundSchema,
  paymentIntentIdSchema
} from '../schemas/paymentSchemas';

const router = Router();

router.post('/payment-intent', authenticate, validateBody(createPaymentIntentSchema), asyncAuthenticatedHandler(createPaymentIntent));

router.post('/confirm/:paymentIntentId', authenticate, validateParams(paymentIntentIdSchema), asyncAuthenticatedHandler(confirmPayment));

router.post('/refund', authenticate, authorize([UserRole.ADMIN, UserRole.STORE_OWNER]), validateBody(refundSchema), asyncAuthenticatedHandler(createRefund));

router.get('/status/:paymentIntentId', authenticate, validateParams(paymentIntentIdSchema), asyncAuthenticatedHandler(getPaymentStatus));

router.post('/webhook', asyncHandler(handleWebhook));

export default router;
