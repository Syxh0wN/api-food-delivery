import { z } from 'zod';
import { FavoriteType } from '@prisma/client';

export const createFavoriteSchema = z.object({
  itemId: z.string().cuid('ID do item inválido'),
  type: z.nativeEnum(FavoriteType),
  listId: z.string().cuid('ID da lista inválido').optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const updateFavoriteSchema = z.object({
  listId: z.string().cuid('ID da lista inválido').optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

export const favoriteFilterSchema = z.object({
  type: z.nativeEnum(FavoriteType).optional(),
  listId: z.string().cuid('ID da lista inválido').optional(),
  isActive: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export const createFavoriteListSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional()
});

export const updateFavoriteListSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional()
});

export const favoriteListFilterSchema = z.object({
  isPublic: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export const favoriteIdSchema = z.object({
  favoriteId: z.string().min(1, 'ID do favorito é obrigatório')
});

export const listIdSchema = z.object({
  listId: z.string().min(1, 'ID da lista é obrigatório')
});

export const toggleFavoriteSchema = z.object({
  itemId: z.string().min(1, 'ID do item é obrigatório'),
  type: z.nativeEnum(FavoriteType)
});

export const checkFavoriteStatusSchema = z.object({
  itemId: z.string().min(1, 'ID do item é obrigatório'),
  type: z.nativeEnum(FavoriteType)
});

export const analyticsQuerySchema = z.object({
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de fim é obrigatória')
});

export const exportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).optional().default('json')
});

export const recommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10)
});

export type CreateFavoriteInput = z.infer<typeof createFavoriteSchema>;
export type UpdateFavoriteInput = z.infer<typeof updateFavoriteSchema>;
export type CreateFavoriteListInput = z.infer<typeof createFavoriteListSchema>;
export type UpdateFavoriteListInput = z.infer<typeof updateFavoriteListSchema>;
