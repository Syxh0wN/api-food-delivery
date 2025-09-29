import { z } from 'zod';

export const reviewIdSchema = z.object({
  reviewId: z.string().cuid('ID da avaliação inválido')
});

export const storeIdSchema = z.object({
  storeId: z.string().cuid('ID da loja inválido')
});

export const storeReviewsQuerySchema = z.object({
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default(20),
  offset: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(0)).optional().default(0)
});

export const userReviewsQuerySchema = z.object({
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default(20),
  offset: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(0)).optional().default(0)
});

export const canReviewQuerySchema = z.object({
  orderId: z.string().cuid().optional()
});

export type ReviewIdParams = z.infer<typeof reviewIdSchema>;
export type StoreIdParams = z.infer<typeof storeIdSchema>;
export type StoreReviewsQuery = z.infer<typeof storeReviewsQuerySchema>;
export type UserReviewsQuery = z.infer<typeof userReviewsQuerySchema>;
export type CanReviewQuery = z.infer<typeof canReviewQuerySchema>;
