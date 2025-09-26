import { prisma } from '../config/database';
import { CreateReviewInput, UpdateReviewInput, ReviewResponse, ReviewListResponse, ReviewStats, ReviewFilter } from '../types/review';
import { OrderStatus, HistoryAction, HistoryEntity } from '@prisma/client';
import { HistoryHelper } from '../utils/historyHelper';

export class ReviewService {
  async createReview(userId: string, input: CreateReviewInput): Promise<ReviewResponse> {
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        storeId: input.storeId,
        orderId: input.orderId || null,
        isActive: true
      }
    });

    if (existingReview) {
      throw new Error('Você já avaliou esta loja para este pedido');
    }

    const store = await prisma.store.findUnique({
      where: { id: input.storeId }
    });

    if (!store) {
      throw new Error('Loja não encontrada');
    }

    if (input.orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: input.orderId,
          userId,
          storeId: input.storeId,
          status: OrderStatus.DELIVERED
        }
      });

      if (!order) {
        throw new Error('Pedido não encontrado ou não foi entregue');
      }
    }

    const includeData: any = {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      store: {
        select: {
          id: true,
          name: true,
          logo: true
        }
      }
    };

    if (input.orderId) {
      includeData.order = {
        select: {
          id: true,
          total: true,
          createdAt: true
        }
      };
    }

    const review = await prisma.review.create({
      data: {
        userId,
        storeId: input.storeId,
        orderId: input.orderId || null,
        rating: input.rating,
        comment: input.comment || null
      },
      include: includeData
    });

    await this.updateStoreRating(input.storeId);

    // Registrar histórico da criação da avaliação
    await HistoryHelper.logReviewAction(
      review.id,
      HistoryAction.REVIEW_CREATED,
      `Avaliação criada para a loja ${store.name} com nota ${input.rating}`,
      undefined,
      {
        storeId: input.storeId,
        storeName: store.name,
        rating: input.rating,
        orderId: input.orderId
      }
    );

    return this.formatReviewResponse(review);
  }

  async updateReview(reviewId: string, userId: string, input: UpdateReviewInput): Promise<ReviewResponse> {
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        order: {
          select: {
            id: true,
            total: true,
            createdAt: true
          }
        }
      }
    });

    if (!review) {
      throw new Error('Avaliação não encontrada');
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (input.rating !== undefined) {
      updateData.rating = input.rating;
    }

    if (input.comment !== undefined) {
      updateData.comment = input.comment;
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        order: {
          select: {
            id: true,
            total: true,
            createdAt: true
          }
        }
      }
    });

    await this.updateStoreRating(review.storeId);

    return this.formatReviewResponse(updatedReview);
  }

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId,
        isActive: true
      }
    });

    if (!review) {
      throw new Error('Avaliação não encontrada');
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: { isActive: false }
    });

    await this.updateStoreRating(review.storeId);
  }

  async getReviewById(reviewId: string): Promise<ReviewResponse> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        order: {
          select: {
            id: true,
            total: true,
            createdAt: true
          }
        }
      }
    });

    if (!review) {
      throw new Error('Avaliação não encontrada');
    }

    return this.formatReviewResponse(review);
  }

  async getReviews(filter: ReviewFilter): Promise<{ reviews: ReviewListResponse[]; total: number }> {
    const where: any = {
      isActive: filter.isActive !== undefined ? filter.isActive : true
    };

    if (filter.storeId) {
      where.storeId = filter.storeId;
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.rating) {
      where.rating = filter.rating;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: filter.limit || 20,
        skip: filter.offset || 0
      }),
      prisma.review.count({ where })
    ]);

    return {
      reviews: reviews.map(review => this.formatReviewListResponse(review)),
      total
    };
  }

  async getStoreReviews(storeId: string, limit: number = 20, offset: number = 0): Promise<{ reviews: ReviewListResponse[]; total: number }> {
    return this.getReviews({ storeId, limit, offset });
  }

  async getUserReviews(userId: string, limit: number = 20, offset: number = 0): Promise<{ reviews: ReviewListResponse[]; total: number }> {
    return this.getReviews({ userId, limit, offset });
  }

  async getStoreStats(storeId: string): Promise<ReviewStats> {
    const reviews = await prisma.review.findMany({
      where: {
        storeId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const stats = await prisma.review.aggregate({
      where: {
        storeId,
        isActive: true
      },
      _count: { id: true },
      _avg: { rating: true }
    });

    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        storeId,
        isActive: true
      },
      _count: { rating: true }
    });

    const distribution: { [key: number]: number } = {};
    ratingDistribution.forEach(item => {
      distribution[item.rating] = item._count.rating;
    });

    return {
      totalReviews: stats._count.id,
      averageRating: stats._avg.rating || 0,
      ratingDistribution: distribution,
      recentReviews: reviews.map(review => this.formatReviewListResponse(review))
    };
  }

  async canUserReviewStore(userId: string, storeId: string, orderId?: string): Promise<boolean> {
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        storeId,
        orderId: orderId || null,
        isActive: true
      }
    });

    if (existingReview) {
      return false;
    }

    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
          storeId,
          status: 'DELIVERED'
        }
      });

      return !!order;
    }

      const hasDeliveredOrder = await prisma.order.findFirst({
        where: {
          userId,
          storeId,
          status: OrderStatus.DELIVERED
        }
      });

    return !!hasDeliveredOrder;
  }

  private async updateStoreRating(storeId: string): Promise<void> {
    const stats = await prisma.review.aggregate({
      where: {
        storeId,
        isActive: true
      },
      _count: { id: true },
      _avg: { rating: true }
    });

    await prisma.store.update({
      where: { id: storeId },
      data: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.id
      }
    });
  }

  private formatReviewResponse(review: any): ReviewResponse {
    return {
      id: review.id,
      userId: review.userId,
      storeId: review.storeId,
      orderId: review.orderId,
      rating: review.rating,
      comment: review.comment,
      isActive: review.isActive,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        name: review.user.name,
        avatar: review.user.avatar
      },
      store: {
        id: review.store.id,
        name: review.store.name,
        logo: review.store.logo
      },
      order: review.order ? {
        id: review.order.id,
        total: Number(review.order.total),
        createdAt: review.order.createdAt
      } : undefined
    } as ReviewResponse;
  }

  private formatReviewListResponse(review: any): ReviewListResponse {
    return {
      id: review.id,
      userId: review.userId,
      storeId: review.storeId,
      orderId: review.orderId,
      rating: review.rating,
      comment: review.comment,
      isActive: review.isActive,
      createdAt: review.createdAt,
      user: {
        id: review.user.id,
        name: review.user.name,
        avatar: review.user.avatar
      }
    };
  }
}

export const reviewService = new ReviewService();
