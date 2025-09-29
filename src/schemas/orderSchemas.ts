import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const createOrderSchema = z.object({
  storeId: z.string().cuid('ID da loja inválido'),
  addressId: z.string().cuid('ID do endereço inválido'),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'CASH']),
  deliveryInstructions: z.string().optional(),
  couponCode: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z.string().optional(),
});

export const orderIdSchema = z.object({
  id: z.string().min(1, 'ID do pedido é obrigatório')
});

export const storeIdSchema = z.object({
  storeId: z.string().cuid('ID da loja inválido')
});

export const storeOrderIdSchema = z.object({
  storeId: z.string().cuid('ID da loja inválido'),
  id: z.string().cuid('ID do pedido inválido')
});

export const paginationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional()
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
