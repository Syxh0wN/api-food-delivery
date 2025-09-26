import { z } from 'zod';

export interface CreateReviewInput {
  storeId: string;
  orderId?: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  userId: string;
  storeId: string;
  orderId: string | null;
  rating: number;
  comment: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  store: {
    id: string;
    name: string;
    logo: string | null;
  };
  order?: {
    id: string;
    total: number;
    createdAt: Date;
  };
}

export interface ReviewListResponse {
  id: string;
  userId: string;
  storeId: string;
  orderId: string | null;
  rating: number;
  comment: string | null;
  isActive: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number;
  };
  recentReviews: ReviewListResponse[];
}

export interface ReviewFilter {
  storeId?: string;
  userId?: string;
  rating?: number;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export const createReviewSchema = z.object({
  storeId: z.string().cuid('ID da loja inválido'),
  orderId: z.string().cuid('ID do pedido inválido').optional(),
  rating: z.number().min(1, 'Avaliação deve ser no mínimo 1').max(5, 'Avaliação deve ser no máximo 5'),
  comment: z.string().max(500, 'Comentário muito longo').optional()
});

export const updateReviewSchema = z.object({
  rating: z.number().min(1, 'Avaliação deve ser no mínimo 1').max(5, 'Avaliação deve ser no máximo 5').optional(),
  comment: z.string().max(500, 'Comentário muito longo').optional()
});

export const reviewFilterSchema = z.object({
  storeId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  rating: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(5)).optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default(20),
  offset: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(0)).optional().default(0)
});
