import { Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import Stripe from 'stripe';
import { RefundRequest } from '../types/payment';

const paymentService = new PaymentService();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake_key', {
  apiVersion: '2025-08-27.basil',
});

const createPaymentIntentSchema = z.object({
  orderId: z.string().cuid('ID do pedido inválido'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  currency: z.string().optional().default('brl'),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX']),
  metadata: z.record(z.string(), z.string()).optional()
});

const refundSchema = z.object({
  paymentIntentId: z.string().min(1, 'ID do payment intent é obrigatório'),
  amount: z.number().min(0.01).optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional()
});

export const createPaymentIntent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const validatedData = createPaymentIntentSchema.parse(req.body);
    const paymentIntent = await paymentService.createPaymentIntent({
      ...validatedData,
      metadata: validatedData.metadata || {}
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Payment intent criado com sucesso', 
      data: { paymentIntent } 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const confirmPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { paymentIntentId } = req.params;
    
    if (!paymentIntentId) {
      res.status(400).json({
        success: false,
        message: 'ID do payment intent é obrigatório'
      });
      return;
    }

    const isConfirmed = await paymentService.confirmPayment(paymentIntentId);
    
    if (isConfirmed) {
      res.status(200).json({ 
        success: true, 
        message: 'Pagamento confirmado com sucesso' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Pagamento não pôde ser confirmado' 
      });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createRefund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
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

    const validatedData = refundSchema.parse(req.body);
    const refund = await paymentService.createRefund(validatedData as RefundRequest);
    
    res.status(201).json({ 
      success: true, 
      message: 'Reembolso criado com sucesso', 
      data: { refund } 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPaymentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { paymentIntentId } = req.params;
    
    if (!paymentIntentId) {
      res.status(400).json({
        success: false,
        message: 'ID do payment intent é obrigatório'
      });
      return;
    }

    const status = await paymentService.getPaymentStatus(paymentIntentId);
    
    res.status(200).json({ 
      success: true, 
      data: { status } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const handleWebhook = async (req: any, res: Response): Promise<void> => {
  try {
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
    
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processado com sucesso' 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
