import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().min(3, 'Rua deve ter no mínimo 3 caracteres'),
  number: z.string().min(1, 'Número deve ter no mínimo 1 caractere'),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, 'Bairro deve ter no mínimo 3 caracteres'),
  city: z.string().min(3, 'Cidade deve ter no mínimo 3 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (UF)'),
  zipCode: z.string().length(8, 'CEP deve ter 8 caracteres')
});

const optionalAddressSchema = z.object({
  street: z.string().min(3, 'Rua deve ter no mínimo 3 caracteres').optional(),
  number: z.string().min(1, 'Número deve ter no mínimo 1 caractere').optional(),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, 'Bairro deve ter no mínimo 3 caracteres').optional(),
  city: z.string().min(3, 'Cidade deve ter no mínimo 3 caracteres').optional(),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (UF)').optional(),
  zipCode: z.string().length(8, 'CEP deve ter 8 caracteres').optional()
});

export const createStoreSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  phone: z.string().min(10, 'Telefone deve ter no mínimo 10 caracteres'),
  address: addressSchema,
  deliveryRadius: z.number().min(1, 'Raio de entrega deve ser no mínimo 1 km'),
  estimatedDeliveryTime: z.number().min(15, 'Tempo estimado deve ser no mínimo 15 minutos'),
  minimumOrderValue: z.number().min(0, 'Valor mínimo deve ser 0 ou maior'),
  isOpen: z.boolean().optional(),
  logo: z.string().url('Logo deve ser uma URL válida').optional(),
  coverImage: z.string().url('Imagem de capa deve ser uma URL válida').optional()
});

export const updateStoreSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').optional(),
  phone: z.string().min(10, 'Telefone deve ter no mínimo 10 caracteres').optional(),
  address: optionalAddressSchema.optional(),
  deliveryRadius: z.number().min(1, 'Raio de entrega deve ser no mínimo 1 km').optional(),
  estimatedDeliveryTime: z.number().min(15, 'Tempo estimado deve ser no mínimo 15 minutos').optional(),
  minimumOrderValue: z.number().min(0, 'Valor mínimo deve ser 0 ou maior').optional(),
  isOpen: z.boolean().optional(),
  logo: z.string().url('Logo deve ser uma URL válida').optional(),
  coverImage: z.string().url('Imagem de capa deve ser uma URL válida').optional()
});

export const storeIdSchema = z.object({
  id: z.string().cuid('ID da loja inválido')
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
