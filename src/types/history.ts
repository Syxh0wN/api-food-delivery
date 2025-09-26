import { HistoryAction, HistoryEntity } from '@prisma/client';

export interface CreateHistoryInput {
  userId?: string;
  entityType: HistoryEntity;
  entityId: string;
  action: HistoryAction;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface HistoryResponse {
  id: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  entityType: HistoryEntity;
  entityId: string;
  action: HistoryAction;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface HistoryListResponse {
  histories: HistoryResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HistoryFilter {
  userId?: string;
  entityType?: HistoryEntity;
  entityId?: string;
  action?: HistoryAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface HistoryStats {
  totalActions: number;
  actionsByType: Record<HistoryAction, number>;
  actionsByEntity: Record<HistoryEntity, number>;
  actionsByUser: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    totalActions: number;
  }>;
  recentActivity: HistoryResponse[];
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  entityType: HistoryEntity;
  entityId: string;
  action: HistoryAction;
  description: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AuditLogFilter {
  userId?: string;
  entityType?: HistoryEntity;
  entityId?: string;
  action?: HistoryAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
