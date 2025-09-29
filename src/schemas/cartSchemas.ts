import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().cuid('ID do produto inválido'),
  quantity: z.number().int().min(1, 'Quantidade deve ser no mínimo 1')
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantidade deve ser no mínimo 1')
});

export const itemIdSchema = z.object({
  itemId: z.string().min(1, 'ID do item é obrigatório')
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
