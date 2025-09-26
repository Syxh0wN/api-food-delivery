import { Request, Response } from 'express';
import { z } from 'zod';
import { HistoryService } from '../services/historyService';
import { PrismaClient, HistoryAction, HistoryEntity } from '@prisma/client';
import { 
  CreateHistoryInput, 
  HistoryFilter, 
  AuditLogFilter
} from '../types/history';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const prisma = new PrismaClient();
const historyService = new HistoryService(prisma);

const createHistorySchema = z.object({
  userId: z.string().optional(),
  entityType: z.nativeEnum(HistoryEntity),
  entityId: z.string(),
  action: z.nativeEnum(HistoryAction),
  description: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

const historyFilterSchema = z.object({
  userId: z.string().optional(),
  entityType: z.nativeEnum(HistoryEntity).optional(),
  entityId: z.string().optional(),
  action: z.nativeEnum(HistoryAction).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

const auditLogFilterSchema = z.object({
  userId: z.string().optional(),
  entityType: z.nativeEnum(HistoryEntity).optional(),
  entityId: z.string().optional(),
  action: z.nativeEnum(HistoryAction).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export const createHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createHistorySchema.parse(req.body);
    
    const history = await historyService.createHistory(validatedData as CreateHistoryInput);
    
    return res.status(201).json(history);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: error.issues
      });
    }
    
    console.error('Erro ao criar histórico:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const getHistories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedFilters = historyFilterSchema.parse(req.query);
    
    const filter: any = {
      ...validatedFilters,
      startDate: validatedFilters.startDate ? new Date(validatedFilters.startDate) : undefined,
      endDate: validatedFilters.endDate ? new Date(validatedFilters.endDate) : undefined
    };
    
    const result = await historyService.getHistories(filter);
    
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Parâmetros inválidos',
        errors: error.issues
      });
    }
    
    console.error('Erro ao buscar históricos:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const getHistoryById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        message: 'ID do histórico é obrigatório'
      });
    }
    
    const history = await historyService.getHistoryById(id);
    
    if (!history) {
      return res.status(404).json({
        message: 'Histórico não encontrado'
      });
    }
    
    return res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const getHistoryStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedFilters = historyFilterSchema.parse(req.query);
    
    const filter: any = {
      ...validatedFilters,
      startDate: validatedFilters.startDate ? new Date(validatedFilters.startDate) : undefined,
      endDate: validatedFilters.endDate ? new Date(validatedFilters.endDate) : undefined
    };
    
    const stats = await historyService.getHistoryStats(filter);
    
    return res.json(stats);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Parâmetros inválidos',
        errors: error.issues
      });
    }
    
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedFilters = auditLogFilterSchema.parse(req.query);
    
    const filter: any = {
      ...validatedFilters,
      startDate: validatedFilters.startDate ? new Date(validatedFilters.startDate) : undefined,
      endDate: validatedFilters.endDate ? new Date(validatedFilters.endDate) : undefined
    };
    
    const result = await historyService.getAuditLogs(filter);
    
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Parâmetros inválidos',
        errors: error.issues
      });
    }
    
    console.error('Erro ao buscar logs de auditoria:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const deleteHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        message: 'ID do histórico é obrigatório'
      });
    }
    
    await historyService.deleteHistory(id);
    
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar histórico:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const deleteOldHistories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { daysToKeep } = req.body;
    
    if (daysToKeep && (typeof daysToKeep !== 'number' || daysToKeep < 1)) {
      return res.status(400).json({
        message: 'daysToKeep deve ser um número maior que 0'
      });
    }
    
    const deletedCount = await historyService.deleteOldHistories(daysToKeep);
    
    return res.json({
      message: `${deletedCount} registros antigos foram removidos`,
      deletedCount
    });
  } catch (error) {
    console.error('Erro ao deletar históricos antigos:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const getUserActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        message: 'ID do usuário é obrigatório'
      });
    }
    
    const filter: any = {
      userId,
      page: 1,
      limit: 50
    };
    
    const result = await historyService.getHistories(filter);
    
    return res.json(result);
  } catch (error) {
    console.error('Erro ao buscar atividade do usuário:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const getEntityHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    
    if (!entityType || !entityId) {
      return res.status(400).json({
        message: 'Tipo de entidade e ID são obrigatórios'
      });
    }
    
    const filter: any = {
      entityType: entityType as HistoryEntity,
      entityId,
      page: 1,
      limit: 50
    };
    
    const result = await historyService.getHistories(filter);
    
    return res.json(result);
  } catch (error) {
    console.error('Erro ao buscar histórico da entidade:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};
