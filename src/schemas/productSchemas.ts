import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  isAvailable: z.boolean().optional(),
  preparationTime: z.number().min(1, 'Tempo de preparo deve ser no mínimo 1 minuto').optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  images: z.array(z.string().url('Imagem deve ser uma URL válida')).optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  nutritionalInfo: z.object({
    calories: z.number().min(0).optional(),
    protein: z.number().min(0).optional(),
    carbs: z.number().min(0).optional(),
    fat: z.number().min(0).optional(),
    fiber: z.number().min(0).optional()
  }).optional()
});

export const updateProductSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero').optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória').optional(),
  isAvailable: z.boolean().optional(),
  preparationTime: z.number().min(1, 'Tempo de preparo deve ser no mínimo 1 minuto').optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  images: z.array(z.string().url('Imagem deve ser uma URL válida')).optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  nutritionalInfo: z.object({
    calories: z.number().min(0).optional(),
    protein: z.number().min(0).optional(),
    carbs: z.number().min(0).optional(),
    fat: z.number().min(0).optional(),
    fiber: z.number().min(0).optional()
  }).optional()
});

export const createCategorySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional()
});

export const updateCategorySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  description: z.string().optional()
});

export const productIdSchema = z.object({
  id: z.string().min(1, 'ID do produto é obrigatório')
});

export const storeIdSchema = z.object({
  storeId: z.string().min(1, 'ID da loja é obrigatório')
});

export const categoryIdSchema = z.object({
  categoryId: z.string().min(1, 'ID da categoria é obrigatório')
});

export const storeProductIdSchema = z.object({
  storeId: z.string().min(1, 'ID da loja é obrigatório'),
  id: z.string().min(1, 'ID do produto é obrigatório')
});

export const categoryIdParamSchema = z.object({
  id: z.string().min(1, 'ID da categoria é obrigatório')
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ProductIdParams = z.infer<typeof productIdSchema>;
export type StoreIdParams = z.infer<typeof storeIdSchema>;
export type CategoryIdParams = z.infer<typeof categoryIdSchema>;
export type StoreProductIdParams = z.infer<typeof storeProductIdSchema>;
