import { PrismaClient, HistoryAction, HistoryEntity } from '@prisma/client';
import { HistoryService } from '../services/historyService';

const prisma = new PrismaClient();
const historyService = new HistoryService(prisma);

export interface HistoryContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class HistoryHelper {
  static async logAction(
    entityType: HistoryEntity,
    entityId: string,
    action: HistoryAction,
    description: string,
    context?: HistoryContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const historyData: any = {
        entityType,
        entityId,
        action,
        description
      };

      if (context?.userId) historyData.userId = context.userId;
      if (metadata) historyData.metadata = metadata;
      if (context?.ipAddress) historyData.ipAddress = context.ipAddress;
      if (context?.userAgent) historyData.userAgent = context.userAgent;

      await historyService.createHistory(historyData);
    } catch (error) {
      console.error('Erro ao registrar histórico:', error);
    }
  }

  static async logUserAction(
    userId: string,
    action: HistoryAction,
    description: string,
    context?: HistoryContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logAction(
      HistoryEntity.USER,
      userId,
      action,
      description,
      context,
      metadata
    );
  }

  static async logStoreAction(
    storeId: string,
    action: HistoryAction,
    description: string,
    context?: HistoryContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logAction(
      HistoryEntity.STORE,
      storeId,
      action,
      description,
      context,
      metadata
    );
  }

  static async logProductAction(
    productId: string,
    action: HistoryAction,
    description: string,
    context?: HistoryContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logAction(
      HistoryEntity.PRODUCT,
      productId,
      action,
      description,
      context,
      metadata
    );
  }

  static async logOrderAction(
    orderId: string,
    action: HistoryAction,
    description: string,
    context?: HistoryContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logAction(
      HistoryEntity.ORDER,
      orderId,
      action,
      description,
      context,
      metadata
    );
  }

  static async logReviewAction(
    reviewId: string,
    action: HistoryAction,
    description: string,
    context?: HistoryContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logAction(
      HistoryEntity.REVIEW,
      reviewId,
      action,
      description,
      context,
      metadata
    );
  }

  static async logChatAction(
    chatRoomId: string,
    action: HistoryAction,
    description: string,
    context?: HistoryContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logAction(
      HistoryEntity.CHAT_ROOM,
      chatRoomId,
      action,
      description,
      context,
      metadata
    );
  }

  static async logSystemAction(
    action: HistoryAction,
    description: string,
    context?: HistoryContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logAction(
      HistoryEntity.SYSTEM,
      'system',
      action,
      description,
      context,
      metadata
    );
  }

  static extractContextFromRequest(req: any): HistoryContext {
    return {
      userId: req.user?.id,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    };
  }
}
