import { Request, Response } from 'express';
import { z } from 'zod';
import { getFavoriteService } from '../services/favoriteService';
import { PrismaClient, FavoriteType, UserRole } from '@prisma/client';
import {
  CreateFavoriteInput,
  UpdateFavoriteInput,
  CreateFavoriteListInput,
  UpdateFavoriteListInput,
  FavoriteFilter,
  FavoriteListFilter
} from '../types/favorite';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const prisma = new PrismaClient();
const favoriteService = getFavoriteService(prisma);

// ===== FAVORITES SCHEMAS =====

const createFavoriteSchema = z.object({
  itemId: z.string().cuid(),
  type: z.nativeEnum(FavoriteType),
  listId: z.string().cuid().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const updateFavoriteSchema = z.object({
  listId: z.string().cuid().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

const favoriteFilterSchema = z.object({
  type: z.nativeEnum(FavoriteType).optional(),
  listId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

// ===== FAVORITE LISTS SCHEMAS =====

const createFavoriteListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional()
});

const updateFavoriteListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional()
});

const favoriteListFilterSchema = z.object({
  isPublic: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

// ===== FAVORITES CONTROLLERS =====

export const createFavorite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const validatedData = createFavoriteSchema.parse(req.body);

    const input: CreateFavoriteInput = {
      userId: req.user.id,
      itemId: validatedData.itemId,
      type: validatedData.type as FavoriteType
    };

    if (validatedData.listId) input.listId = validatedData.listId;
    if (validatedData.notes) input.notes = validatedData.notes;
    if (validatedData.tags) input.tags = validatedData.tags;

    const favorite = await favoriteService.createFavorite(input);

    return res.status(201).json(favorite);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.issues });
    }
    console.error('Erro ao criar favorito:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const updateFavorite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const { favoriteId } = req.params;
    if (!favoriteId) {
      return res.status(400).json({ message: 'ID do favorito é obrigatório' });
    }

    const validatedData = updateFavoriteSchema.parse(req.body);

    const input: UpdateFavoriteInput = {};
    if (validatedData.listId !== undefined) input.listId = validatedData.listId;
    if (validatedData.notes !== undefined) input.notes = validatedData.notes;
    if (validatedData.tags !== undefined) input.tags = validatedData.tags;
    if (validatedData.isActive !== undefined) input.isActive = validatedData.isActive;

    const favorite = await favoriteService.updateFavorite(favoriteId, input, req.user.id);

    return res.json(favorite);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.issues });
    }
    console.error('Erro ao atualizar favorito:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const deleteFavorite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const { favoriteId } = req.params;
    if (!favoriteId) {
      return res.status(400).json({ message: 'ID do favorito é obrigatório' });
    }

    await favoriteService.deleteFavorite(favoriteId, req.user.id);

    return res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar favorito:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getFavoriteById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const { favoriteId } = req.params;
    if (!favoriteId) {
      return res.status(400).json({ message: 'ID do favorito é obrigatório' });
    }

    const favorite = await favoriteService.getFavoriteById(favoriteId, req.user.id);
    if (!favorite) {
      return res.status(404).json({ message: 'Favorito não encontrado' });
    }

    return res.json(favorite);
  } catch (error: any) {
    console.error('Erro ao buscar favorito:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getFavorites = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const validatedFilters = favoriteFilterSchema.parse(req.query);
    const filter: FavoriteFilter = {
      userId: req.user.id
    };
    if (validatedFilters.type !== undefined) filter.type = validatedFilters.type;
    if (validatedFilters.listId !== undefined) filter.listId = validatedFilters.listId;
    if (validatedFilters.isActive !== undefined) filter.isActive = validatedFilters.isActive;
    if (validatedFilters.tags !== undefined) filter.tags = validatedFilters.tags;
    if (validatedFilters.search !== undefined) filter.search = validatedFilters.search;
    if (validatedFilters.page !== undefined) filter.page = validatedFilters.page;
    if (validatedFilters.limit !== undefined) filter.limit = validatedFilters.limit;

    const favorites = await favoriteService.getFavorites(filter);

    return res.json(favorites);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.issues });
    }
    console.error('Erro ao buscar favoritos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// ===== FAVORITE LISTS CONTROLLERS =====

export const createFavoriteList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const validatedData = createFavoriteListSchema.parse(req.body);

    const input: CreateFavoriteListInput = {
      userId: req.user.id,
      name: validatedData.name
    };
    if (validatedData.description !== undefined) input.description = validatedData.description;
    if (validatedData.isPublic !== undefined) input.isPublic = validatedData.isPublic;
    if (validatedData.tags !== undefined) input.tags = validatedData.tags;
    if (validatedData.color !== undefined) input.color = validatedData.color;

    const list = await favoriteService.createFavoriteList(input);

    return res.status(201).json(list);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.issues });
    }
    console.error('Erro ao criar lista de favoritos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const updateFavoriteList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const { listId } = req.params;
    if (!listId) {
      return res.status(400).json({ message: 'ID da lista é obrigatório' });
    }

    const validatedData = updateFavoriteListSchema.parse(req.body);

    const input: UpdateFavoriteListInput = {};
    if (validatedData.name !== undefined) input.name = validatedData.name;
    if (validatedData.description !== undefined) input.description = validatedData.description;
    if (validatedData.isPublic !== undefined) input.isPublic = validatedData.isPublic;
    if (validatedData.tags !== undefined) input.tags = validatedData.tags;
    if (validatedData.color !== undefined) input.color = validatedData.color;

    const list = await favoriteService.updateFavoriteList(listId, input, req.user.id);

    return res.json(list);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.issues });
    }
    console.error('Erro ao atualizar lista de favoritos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const deleteFavoriteList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const { listId } = req.params;
    if (!listId) {
      return res.status(400).json({ message: 'ID da lista é obrigatório' });
    }

    await favoriteService.deleteFavoriteList(listId, req.user.id);

    return res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar lista de favoritos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getFavoriteListById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { listId } = req.params;
    if (!listId) {
      return res.status(400).json({ message: 'ID da lista é obrigatório' });
    }

    const list = await favoriteService.getFavoriteListById(listId, req.user?.id);
    if (!list) {
      return res.status(404).json({ message: 'Lista não encontrada' });
    }

    return res.json(list);
  } catch (error: any) {
    console.error('Erro ao buscar lista de favoritos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getFavoriteLists = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedFilters = favoriteListFilterSchema.parse(req.query);
    const filter: FavoriteListFilter = {};
    if (validatedFilters.isPublic !== undefined) filter.isPublic = validatedFilters.isPublic;
    if (validatedFilters.tags !== undefined) filter.tags = validatedFilters.tags;
    if (validatedFilters.search !== undefined) filter.search = validatedFilters.search;
    if (validatedFilters.page !== undefined) filter.page = validatedFilters.page;
    if (validatedFilters.limit !== undefined) filter.limit = validatedFilters.limit;

    // Se não especificado, mostrar apenas listas públicas ou do usuário logado
    if (!filter.isPublic && req.user?.id) {
      filter.userId = req.user.id;
    }

    const lists = await favoriteService.getFavoriteLists(filter);

    return res.json(lists);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.issues });
    }
    console.error('Erro ao buscar listas de favoritos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// ===== STATISTICS & ANALYTICS CONTROLLERS =====

export const getFavoriteStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await favoriteService.getFavoriteStats(req.user?.id);

    return res.json(stats);
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas de favoritos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getFavoriteAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem ver análises.' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Data de início e fim são obrigatórias' });
    }

    const analytics = await favoriteService.getFavoriteAnalytics(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return res.json(analytics);
  } catch (error: any) {
    console.error('Erro ao buscar análises de favoritos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// ===== RECOMMENDATIONS CONTROLLER =====

export const getRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const { limit } = req.query;
    const limitNumber = limit ? parseInt(limit as string) : 10;

    const recommendations = await favoriteService.getRecommendations(req.user.id, limitNumber);

    return res.json(recommendations);
  } catch (error: any) {
    console.error('Erro ao buscar recomendações:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// ===== EXPORT CONTROLLER =====

export const exportFavorites = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const { format = 'json' } = req.query;

    if (format !== 'json' && format !== 'csv') {
      return res.status(400).json({ message: 'Formato deve ser json ou csv' });
    }

    const exportData = await favoriteService.exportFavorites(req.user.id, format as 'json' | 'csv');

    if (format === 'csv') {
      // Implementar conversão para CSV se necessário
      return res.json({ message: 'Exportação CSV em desenvolvimento', data: exportData });
    }

    return res.json(exportData);
  } catch (error: any) {
    console.error('Erro ao exportar favoritos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// ===== UTILITY CONTROLLERS =====

export const toggleFavorite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const { itemId, type } = req.params;

    if (!itemId || !type) {
      return res.status(400).json({ message: 'ID do item e tipo são obrigatórios' });
    }

    // Verificar se já existe
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_itemId_type: {
          userId: req.user.id,
          itemId,
          type: type as FavoriteType
        }
      }
    });

    if (existingFavorite) {
      // Remover favorito
      await favoriteService.deleteFavorite(existingFavorite.id, req.user.id);
      return res.json({ 
        message: 'Favorito removido',
        isFavorited: false,
        favoriteId: null
      });
    } else {
      // Adicionar favorito
      const favorite = await favoriteService.createFavorite({
        userId: req.user.id,
        itemId,
        type: type as FavoriteType
      });
      return res.json({ 
        message: 'Favorito adicionado',
        isFavorited: true,
        favoriteId: favorite.id
      });
    }
  } catch (error: any) {
    console.error('Erro ao alternar favorito:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const checkFavoriteStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const { itemId, type } = req.params;

    if (!itemId || !type) {
      return res.status(400).json({ message: 'ID do item e tipo são obrigatórios' });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_itemId_type: {
          userId: req.user.id,
          itemId,
          type: type as FavoriteType
        }
      }
    });

    return res.json({
      isFavorited: !!favorite,
      favoriteId: favorite?.id || null,
      listId: favorite?.listId || null
    });
  } catch (error: any) {
    console.error('Erro ao verificar status do favorito:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
