import { Request, Response } from 'express';
import { reviewService } from '../services/reviewService';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess } from '../middleware/errorHandler';
import { CreateReviewInput, UpdateReviewInput, ReviewFilter } from '../types/review';

export const createReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedData = req.body as CreateReviewInput;
  const userId = req.user!.id;

  const review = await reviewService.createReview(userId, validatedData);
  sendSuccess(res, 'Avaliação criada com sucesso', { review }, 201);
};

export const updateReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { reviewId } = req.params as { reviewId: string };
  const validatedData = req.body as UpdateReviewInput;
  const userId = req.user!.id;

  const review = await reviewService.updateReview(reviewId, userId, validatedData);
  sendSuccess(res, 'Avaliação atualizada com sucesso', { review });
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { reviewId } = req.params as { reviewId: string };
  const userId = req.user!.id;

  await reviewService.deleteReview(reviewId, userId);
  sendSuccess(res, 'Avaliação removida com sucesso');
};

export const getReviewById = async (req: Request, res: Response): Promise<void> => {
  const { reviewId } = req.params as { reviewId: string };

  const review = await reviewService.getReviewById(reviewId);
  sendSuccess(res, 'Avaliação obtida com sucesso', { review });
};

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  const filter = req.query as ReviewFilter;

  const result = await reviewService.getReviews(filter);
  sendSuccess(res, 'Avaliações obtidas com sucesso', {
    reviews: result.reviews,
    total: result.total,
    limit: filter.limit,
    offset: filter.offset
  });
};

export const getStoreReviews = async (req: Request, res: Response): Promise<void> => {
  const { storeId } = req.params as { storeId: string };
  const { limit, offset } = req.query as { limit?: string; offset?: string };

  const limitNum = parseInt(limit || '20');
  const offsetNum = parseInt(offset || '0');

  const result = await reviewService.getStoreReviews(storeId, limitNum, offsetNum);
  sendSuccess(res, 'Avaliações da loja obtidas com sucesso', {
    reviews: result.reviews,
    total: result.total,
    limit: limitNum,
    offset: offsetNum
  });
};

export const getUserReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { limit, offset } = req.query as { limit?: string; offset?: string };

  const limitNum = parseInt(limit || '20');
  const offsetNum = parseInt(offset || '0');

  const result = await reviewService.getUserReviews(userId, limitNum, offsetNum);
  sendSuccess(res, 'Avaliações do usuário obtidas com sucesso', {
    reviews: result.reviews,
    total: result.total,
    limit: limitNum,
    offset: offsetNum
  });
};

export const getStoreStats = async (req: Request, res: Response): Promise<void> => {
  const { storeId } = req.params as { storeId: string };

  const stats = await reviewService.getStoreStats(storeId);
  sendSuccess(res, 'Estatísticas da loja obtidas com sucesso', { stats });
};

export const canUserReviewStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { storeId } = req.params as { storeId: string };
  const { orderId } = req.query as { orderId?: string };
  const userId = req.user!.id;

  const canReview = await reviewService.canUserReviewStore(userId, storeId, orderId);
  sendSuccess(res, 'Verificação de avaliação obtida com sucesso', { canReview });
};
