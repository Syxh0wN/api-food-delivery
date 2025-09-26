import { Request, Response } from 'express';
import { z } from 'zod';
import { reviewService } from '../services/reviewService';
import { CreateReviewInput, UpdateReviewInput, ReviewFilter } from '../types/review';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const createReviewSchema = z.object({
  storeId: z.string().cuid('ID da loja inválido'),
  orderId: z.string().cuid('ID do pedido inválido').optional(),
  rating: z.number().min(1, 'Avaliação deve ser no mínimo 1').max(5, 'Avaliação deve ser no máximo 5'),
  comment: z.string().max(500, 'Comentário muito longo').optional()
});

const updateReviewSchema = z.object({
  rating: z.number().min(1, 'Avaliação deve ser no mínimo 1').max(5, 'Avaliação deve ser no máximo 5').optional(),
  comment: z.string().max(500, 'Comentário muito longo').optional()
});

const reviewFilterSchema = z.object({
  storeId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  rating: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(5)).optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default(20),
  offset: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(0)).optional().default(0)
});

export const createReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createReviewSchema.parse(req.body);
    const userId = req.user!.userId;

    const review = await reviewService.createReview(userId, validatedData as CreateReviewInput);

    return res.status(201).json({
      success: true,
      message: 'Avaliação criada com sucesso',
      data: { review }
    });
  } catch (error: any) {
    console.error('Erro ao criar avaliação:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

export const updateReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const validatedData = updateReviewSchema.parse(req.body);
    const userId = req.user!.userId;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: 'ID da avaliação é obrigatório'
      });
    }

    const review = await reviewService.updateReview(reviewId, userId, validatedData as UpdateReviewInput);

    return res.status(200).json({
      success: true,
      message: 'Avaliação atualizada com sucesso',
      data: { review }
    });
  } catch (error: any) {
    console.error('Erro ao atualizar avaliação:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user!.userId;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: 'ID da avaliação é obrigatório'
      });
    }

    await reviewService.deleteReview(reviewId, userId);

    return res.status(200).json({
      success: true,
      message: 'Avaliação removida com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao remover avaliação:', error);

    return res.status(400).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

export const getReviewById = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: 'ID da avaliação é obrigatório'
      });
    }

    const review = await reviewService.getReviewById(reviewId);

    return res.status(200).json({
      success: true,
      data: { review }
    });
  } catch (error: any) {
    console.error('Erro ao obter avaliação:', error);

    return res.status(404).json({
      success: false,
      message: error.message || 'Avaliação não encontrada'
    });
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const validatedData = reviewFilterSchema.parse(req.query);
    const filter: ReviewFilter = validatedData as any;

    const result = await reviewService.getReviews(filter);

    return res.status(200).json({
      success: true,
      data: {
        reviews: result.reviews,
        total: result.total,
        limit: filter.limit,
        offset: filter.offset
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter avaliações:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

export const getStoreReviews = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'ID da loja é obrigatório'
      });
    }

    const result = await reviewService.getStoreReviews(storeId, limit, offset);

    return res.status(200).json({
      success: true,
      data: {
        reviews: result.reviews,
        total: result.total,
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter avaliações da loja:', error);

    return res.status(400).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

export const getUserReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await reviewService.getUserReviews(userId, limit, offset);

    return res.status(200).json({
      success: true,
      data: {
        reviews: result.reviews,
        total: result.total,
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter avaliações do usuário:', error);

    return res.status(400).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

export const getStoreStats = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'ID da loja é obrigatório'
      });
    }

    const stats = await reviewService.getStoreStats(storeId);

    return res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error: any) {
    console.error('Erro ao obter estatísticas da loja:', error);

    return res.status(400).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

export const canUserReviewStore = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { storeId } = req.params;
    const { orderId } = req.query;
    const userId = req.user!.userId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'ID da loja é obrigatório'
      });
    }

    const canReview = await reviewService.canUserReviewStore(
      userId, 
      storeId, 
      orderId as string
    );

    return res.status(200).json({
      success: true,
      data: { canReview }
    });
  } catch (error: any) {
    console.error('Erro ao verificar se usuário pode avaliar:', error);

    return res.status(400).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};
