import Stripe from 'stripe';
import { prisma } from '../config/database';
import { 
  CreatePaymentIntentInput, 
  PaymentIntentResponse, 
  PaymentWebhookData,
  RefundRequest,
  RefundResponse 
} from '../types/payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake_key', {
  apiVersion: '2025-08-27.basil',
});

export class PaymentService {
  async createPaymentIntent(data: CreatePaymentIntentInput): Promise<PaymentIntentResponse> {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { user: true, store: true }
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    if (order.paymentStatus === 'paid') {
      throw new Error('Pedido já foi pago');
    }

    const amountInCents = Math.round(data.amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: data.currency || 'brl',
      metadata: {
        orderId: data.orderId,
        userId: order.userId,
        storeId: order.storeId,
        ...data.metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    await prisma.order.update({
      where: { id: data.orderId },
      data: { 
        paymentStatus: 'processing',
        paymentMethod: data.paymentMethod
      }
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || '',
      amount: data.amount,
      currency: data.currency || 'brl',
      status: paymentIntent.status,
      orderId: data.orderId,
      createdAt: new Date()
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      const orderId = paymentIntent.metadata.orderId;
      
      if (!orderId) {
        throw new Error('Order ID não encontrado no metadata');
      }
      
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          paymentStatus: 'paid',
          status: 'CONFIRMED'
        }
      });

      return true;
    }

    return false;
  }

  async handleWebhook(webhookData: PaymentWebhookData): Promise<void> {
    const { type, data } = webhookData;
    
    if (type === 'payment_intent.succeeded') {
      const paymentIntent = data.object;
      const orderId = paymentIntent.metadata.orderId;
      
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          paymentStatus: 'paid',
          status: 'CONFIRMED'
        }
      });
    } else if (type === 'payment_intent.payment_failed') {
      const paymentIntent = data.object;
      const orderId = paymentIntent.metadata.orderId;
      
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          paymentStatus: 'failed',
          status: 'CANCELLED'
        }
      });
    }
  }

  async createRefund(refundData: RefundRequest): Promise<RefundResponse> {
    const order = await prisma.order.findFirst({
      where: { 
        paymentStatus: 'paid',
        paymentMethod: 'CREDIT_CARD'
      }
    });

    if (!order) {
      throw new Error('Pedido não encontrado ou não pode ser reembolsado');
    }

    const refundParams: any = {
      payment_intent: refundData.paymentIntentId,
      reason: refundData.reason || 'requested_by_customer',
    };

    if (refundData.amount) {
      refundParams.amount = Math.round(refundData.amount * 100);
    }

    const refund = await stripe.refunds.create(refundParams);

    await prisma.order.update({
      where: { id: order.id },
      data: { 
        paymentStatus: 'refunded',
        status: 'CANCELLED'
      }
    });

    return {
      id: refund.id,
      amount: refund.amount / 100,
      status: refund.status || 'pending',
      reason: refund.reason || 'requested_by_customer',
      createdAt: new Date(refund.created * 1000)
    };
  }

  async getPaymentStatus(paymentIntentId: string): Promise<string> {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status;
  }
}
