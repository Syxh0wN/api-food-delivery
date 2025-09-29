import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  orderId: z.string().cuid('ID do pedido inválido'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  currency: z.string().optional().default('brl'),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX']),
  metadata: z.record(z.string(), z.string()).optional()
});

export const refundSchema = z.object({
  paymentIntentId: z.string().min(1, 'ID do payment intent é obrigatório'),
  amount: z.number().min(0.01).optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional()
});

export const paymentIntentIdSchema = z.object({
  paymentIntentId: z.string().min(1, 'ID do payment intent é obrigatório')
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
