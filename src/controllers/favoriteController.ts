import { Response } from 'express';
import { getFavoriteService } from '../services/favoriteService';
import { PrismaClient, FavoriteType, UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendNotFound } from '../middleware/errorHandler';
import {
  CreateFavoriteInput,
  UpdateFavoriteInput,
  CreateFavoriteListInput,
  UpdateFavoriteListInput,
  FavoriteFilter,
  FavoriteListFilter
} from '../types/favorite';


const prisma = new PrismaClient();
const favoriteService = getFavoriteService(prisma);


// ===== FAVORITES CONTROLLERS =====

export const createFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Token de autenticação necessário' });
    return;
  }

  const validatedData = req.body as CreateFavoriteInput;

  const input: CreateFavoriteInput = {
    userId: req.user.id,
    itemId: validatedData.itemId,
    type: validatedData.type as FavoriteType
  };

  if (validatedData.listId) input.listId = validatedData.listId;
  if (validatedData.notes) input.notes = validatedData.notes;
  if (validatedData.tags) input.tags = validatedData.tags;

  const favorite = await favoriteService.createFavorite(input);
  sendSuccess(res, 'Favorito criado com sucesso', favorite, 201);
};

export const updateFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Token de autenticação necessário' });
    return;
  }

  const { favoriteId } = req.params as { favoriteId: string };
  const validatedData = req.body as UpdateFavoriteInput;

  const input: UpdateFavoriteInput = {};
  if (validatedData.listId !== undefined) input.listId = validatedData.listId;
  if (validatedData.notes !== undefined) input.notes = validatedData.notes;
  if (validatedData.tags !== undefined) input.tags = validatedData.tags;
  if (validatedData.isActive !== undefined) input.isActive = validatedData.isActive;

  const favorite = await favoriteService.updateFavorite(favoriteId, input, req.user.id);
  sendSuccess(res, 'Favorito atualizado com sucesso', favorite);
};

export const deleteFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Token de autenticação necessário' });
    return;
  }

  const { favoriteId } = req.params as { favoriteId: string };
  await favoriteService.deleteFavorite(favoriteId, req.user.id);
  sendSuccess(res, 'Favorito removido com sucesso');
};

export const getFavoriteById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Token de autenticação necessário' });
    return;
  }

  const { favoriteId } = req.params as { favoriteId: string };
  const favorite = await favoriteService.getFavoriteById(favoriteId, req.user.id);
  
  if (!favorite) {
    sendNotFound(res, 'Favorito não encontrado');
    return;
  }

  sendSuccess(res, 'Favorito obtido com sucesso', favorite);
};

export const getFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Token de autenticação necessário' });
    return;
  }

  const validatedFilters = req.query as any;
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
  sendSuccess(res, 'Favoritos obtidos com sucesso', favorites);
};

// ===== FAVORITE LISTS CONTROLLERS =====

export const createFavoriteList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Token de autenticação necessário' });
    return;
  }

  const validatedData = req.body as CreateFavoriteListInput;

  const input: CreateFavoriteListInput = {
    userId: req.user.id,
    name: validatedData.name
  };
  if (validatedData.description !== undefined) input.description = validatedData.description;
  if (validatedData.isPublic !== undefined) input.isPublic = validatedData.isPublic;
  if (validatedData.tags !== undefined) input.tags = validatedData.tags;
  if (validatedData.color !== undefined) input.color = validatedData.color;

  const list = await favoriteService.createFavoriteList(input);
  sendSuccess(res, 'Lista de favoritos criada com sucesso', list, 201);
};

export const updateFavoriteList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Token de autenticação necessário' });
    return;
  }

  const { listId } = req.params as { listId: string };
  const validatedData = req.body as UpdateFavoriteListInput;

  const input: UpdateFavoriteListInput = {};
  if (validatedData.name !== undefined) input.name = validatedData.name;
  if (validatedData.description !== undefined) input.description = validatedData.description;
  if (validatedData.isPublic !== undefined) input.isPublic = validatedData.isPublic;
  if (validatedData.tags !== undefined) input.tags = validatedData.tags;
  if (validatedData.color !== undefined) input.color = validatedData.color;

  const list = await favoriteService.updateFavoriteList(listId, input, req.user.id);
  sendSuccess(res, 'Lista de favoritos atualizada com sucesso', list);
};

export const deleteFavoriteList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Token de autenticação necessário' });
    return;
  }

  const { listId } = req.params as { listId: string };
  await favoriteService.deleteFavoriteList(listId, req.user.id);
  sendSuccess(res, 'Lista de favoritos removida com sucesso');
};

export const getFavoriteListById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { listId } = req.params as { listId: string };
  const list = await favoriteService.getFavoriteListById(listId, req.user?.id);
  
  if (!list) {
    sendNotFound(res, 'Lista não encontrada');
    return;
  }

  sendSuccess(res, 'Lista obtida com sucesso', list);
};

export const getFavoriteLists = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedFilters = req.query as any;
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
  sendSuccess(res, 'Listas obtidas com sucesso', lists);
};

// ===== STATISTICS & ANALYTICS CONTROLLERS =====

export const getFavoriteStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await favoriteService.getFavoriteStats(req.user?.id);
  sendSuccess(res, 'Estatísticas obtidas com sucesso', stats);
};

export const getFavoriteAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({ message: 'Acesso negado. Apenas administradores podem ver análises.' });
    return;
  }

  const { startDate, endDate } = req.query as { startDate: string; endDate: string };

  const analytics = await favoriteService.getFavoriteAnalytics(
    new Date(startDate),
    new Date(endDate)
  );

  sendSuccess(res, 'Análises obtidas com sucesso', analytics);
};

// ===== RECOMMENDATIONS CONTROLLER =====

export const getRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Token de autenticação necessário' });
    return;
  }

  const { limit } = req.query as { limit?: string };
  const limitNumber = limit ? parseInt(limit) : 10;

  const recommendations = await favoriteService.getRecommendations(req.user.id, limitNumber);
  sendSuccess(res, 'Recomendações obtidas com sucesso', recommendations);
};

// ===== EXPORT CONTROLLER =====

export const exportFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Token de autenticação necessário' });
    return;
  }

  const { format = 'json' } = req.query as { format?: string };

  const exportData = await favoriteService.exportFavorites(req.user.id, format as 'json' | 'csv');

  if (format === 'csv') {
    sendSuccess(res, 'Exportação CSV em desenvolvimento', { data: exportData });
    return;
  }

  sendSuccess(res, 'Favoritos exportados com sucesso', exportData);
};

// ===== UTILITY CONTROLLERS =====

export const toggleFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Token de autenticação necessário' });
    return;
  }

  const { itemId, type } = req.params as { itemId: string; type: string };

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
    sendSuccess(res, 'Favorito removido', {
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
    sendSuccess(res, 'Favorito adicionado', {
      isFavorited: true,
      favoriteId: favorite.id
    });
  }
};

export const checkFavoriteStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Token de autenticação necessário' });
    return;
  }

  const { itemId, type } = req.params as { itemId: string; type: string };

  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_itemId_type: {
        userId: req.user.id,
        itemId,
        type: type as FavoriteType
      }
    }
  });

  sendSuccess(res, 'Status verificado com sucesso', {
    isFavorited: !!favorite,
    favoriteId: favorite?.id || null,
    listId: favorite?.listId || null
  });
};
