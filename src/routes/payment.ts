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

const router = Router();

router.post('/payment-intent', authenticate, createPaymentIntent);

router.post('/confirm/:paymentIntentId', authenticate, confirmPayment);

router.post('/refund', authenticate, createRefund);

router.get('/status/:paymentIntentId', authenticate, getPaymentStatus);

router.post('/webhook', handleWebhook);

export default router;
