import { PrismaClient, History, User, HistoryAction, HistoryEntity } from '@prisma/client';
import { 
  CreateHistoryInput, 
  HistoryResponse, 
  HistoryListResponse, 
  HistoryFilter, 
  HistoryStats,
  AuditLog,
  AuditLogFilter,
  AuditLogResponse
} from '../types/history';

export class HistoryService {
  constructor(private prisma: PrismaClient) {}

  async createHistory(input: CreateHistoryInput): Promise<HistoryResponse> {
    const historyData: any = {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      description: input.description
    };

    if (input.userId) historyData.userId = input.userId;
    if (input.metadata) historyData.metadata = input.metadata;
    if (input.ipAddress) historyData.ipAddress = input.ipAddress;
    if (input.userAgent) historyData.userAgent = input.userAgent;

    const history = await this.prisma.history.create({
      data: historyData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return this.formatHistoryResponse(history);
  }

  async getHistories(filter: HistoryFilter): Promise<HistoryListResponse> {
    const {
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = filter;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [histories, total] = await Promise.all([
      this.prisma.history.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.history.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      histories: histories.map(history => this.formatHistoryResponse(history)),
      total,
      page,
      limit,
      totalPages
    };
  }

  async getHistoryById(id: string): Promise<HistoryResponse | null> {
    const history = await this.prisma.history.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return history ? this.formatHistoryResponse(history) : null;
  }

  async getHistoryStats(filter?: Partial<HistoryFilter>): Promise<HistoryStats> {
    const where: any = {};

    if (filter?.userId) where.userId = filter.userId;
    if (filter?.entityType) where.entityType = filter.entityType;
    if (filter?.entityId) where.entityId = filter.entityId;
    if (filter?.action) where.action = filter.action;
    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    const [
      totalActions,
      actionsByType,
      actionsByEntity,
      actionsByUser,
      recentActivity
    ] = await Promise.all([
      this.prisma.history.count({ where }),
      this.getActionsByType(where),
      this.getActionsByEntity(where),
      this.getActionsByUser(where),
      this.getRecentActivity(where)
    ]);

    return {
      totalActions,
      actionsByType,
      actionsByEntity,
      actionsByUser,
      recentActivity
    };
  }

  async getAuditLogs(filter: AuditLogFilter): Promise<AuditLogResponse> {
    const {
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = filter;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [histories, total] = await Promise.all([
      this.prisma.history.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.history.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      logs: histories.map(history => this.formatAuditLog(history)),
      total,
      page,
      limit,
      totalPages
    };
  }

  async deleteHistory(id: string): Promise<void> {
    await this.prisma.history.delete({
      where: { id }
    });
  }

  async deleteOldHistories(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.history.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  }

  private async getActionsByType(where: any): Promise<Record<HistoryAction, number>> {
    const actions = await this.prisma.history.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true
      }
    });

    const result: Record<string, number> = {};
    Object.values(HistoryAction).forEach(action => {
      result[action] = 0;
    });

    actions.forEach(item => {
      result[item.action] = item._count.action;
    });

    return result as Record<HistoryAction, number>;
  }

  private async getActionsByEntity(where: any): Promise<Record<HistoryEntity, number>> {
    const entities = await this.prisma.history.groupBy({
      by: ['entityType'],
      where,
      _count: {
        entityType: true
      }
    });

    const result: Record<string, number> = {};
    Object.values(HistoryEntity).forEach(entity => {
      result[entity] = 0;
    });

    entities.forEach(item => {
      result[item.entityType] = item._count.entityType;
    });

    return result as Record<HistoryEntity, number>;
  }

  private async getActionsByUser(where: any): Promise<Array<{
    userId: string;
    userName: string;
    userEmail: string;
    totalActions: number;
  }>> {
    const userActions = await this.prisma.history.groupBy({
      by: ['userId'],
      where: {
        ...where,
        userId: { not: null }
      },
      _count: {
        userId: true
      },
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 10
    });

    const userIds = userActions.map(item => item.userId).filter(Boolean) as string[];

    if (userIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return userActions.map(item => {
      const user = users.find(u => u.id === item.userId);
      return {
        userId: item.userId || '',
        userName: user?.name || 'Usuário desconhecido',
        userEmail: user?.email || '',
        totalActions: item._count.userId
      };
    });
  }

  private async getRecentActivity(where: any): Promise<HistoryResponse[]> {
    const histories = await this.prisma.history.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return histories.map(history => this.formatHistoryResponse(history));
  }

  private formatHistoryResponse(history: any): HistoryResponse {
    return {
      id: history.id,
      userId: history.userId,
      user: history.user,
      entityType: history.entityType,
      entityId: history.entityId,
      action: history.action,
      description: history.description,
      metadata: history.metadata,
      ipAddress: history.ipAddress,
      userAgent: history.userAgent,
      createdAt: history.createdAt
    };
  }

  private formatAuditLog(history: any): AuditLog {
    return {
      id: history.id,
      userId: history.userId,
      userName: history.user?.name,
      userEmail: history.user?.email,
      entityType: history.entityType,
      entityId: history.entityId,
      action: history.action,
      description: history.description,
      oldValues: history.metadata?.oldValues,
      newValues: history.metadata?.newValues,
      metadata: history.metadata,
      ipAddress: history.ipAddress,
      userAgent: history.userAgent,
      createdAt: history.createdAt
    };
  }
}
