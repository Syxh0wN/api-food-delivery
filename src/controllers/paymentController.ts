import { Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';
import Stripe from 'stripe';
import { CreatePaymentIntentInput, RefundInput } from '../schemas/paymentSchemas';

const paymentService = new PaymentService();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake_key', {
  apiVersion: '2025-08-27.basil',
});

export const createPaymentIntent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const validatedData = req.body as CreatePaymentIntentInput;
  const paymentIntent = await paymentService.createPaymentIntent({
    ...validatedData,
    metadata: validatedData.metadata || {}
  });
  
  sendSuccess(res, 'Payment intent criado com sucesso', { paymentIntent }, 201);
};

export const confirmPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { paymentIntentId } = req.params as { paymentIntentId: string };
  const isConfirmed = await paymentService.confirmPayment(paymentIntentId);
  
  if (isConfirmed) {
    sendSuccess(res, 'Pagamento confirmado com sucesso');
  } else {
    res.status(400).json({ 
      success: false, 
      message: 'Pagamento não pôde ser confirmado' 
    });
  }
};

export const createRefund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.STORE_OWNER) {
    res.status(403).json({ 
      success: false,
      message: 'Acesso negado. Apenas administradores e donos de loja podem criar reembolsos' 
    });
    return;
  }

  const validatedData = req.body as RefundInput;
  const refund = await paymentService.createRefund(validatedData as any);
  sendSuccess(res, 'Reembolso criado com sucesso', { refund }, 201);
};

export const getPaymentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { paymentIntentId } = req.params as { paymentIntentId: string };
  const status = await paymentService.getPaymentStatus(paymentIntentId);
  sendSuccess(res, 'Status do pagamento obtido com sucesso', { status });
};

export const handleWebhook = async (req: any, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    res.status(500).json({ 
      success: false,
      message: 'Webhook secret não configurado' 
    });
    return;
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    res.status(400).json({ 
      success: false,
      message: `Webhook signature verification failed: ${err.message}` 
    });
    return;
  }

  await paymentService.handleWebhook(event as any);
  sendSuccess(res, 'Webhook processado com sucesso');
};
