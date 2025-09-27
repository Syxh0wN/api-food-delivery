import { PrismaClient, FavoriteType, HistoryAction, HistoryEntity } from '@prisma/client';
import {
  CreateFavoriteInput,
  UpdateFavoriteInput,
  Favorite,
  CreateFavoriteListInput,
  UpdateFavoriteListInput,
  FavoriteList,
  FavoriteStats,
  FavoriteRecommendation,
  FavoriteFilter,
  FavoriteListFilter,
  FavoriteListResponse,
  FavoriteListListResponse,
  FavoriteAnalytics,
  FavoriteExport
} from '../types/favorite';
import { HistoryHelper } from '../utils/historyHelper';

export class FavoriteService {
  constructor(private prisma: PrismaClient) {}

  // ===== FAVORITES CRUD =====

  async createFavorite(input: CreateFavoriteInput): Promise<Favorite> {
    // Verificar se já existe
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_itemId_type: {
          userId: input.userId,
          itemId: input.itemId,
          type: input.type
        }
      }
    });

    if (existingFavorite) {
      throw new Error('Item já está nos favoritos');
    }

    // Verificar se o item existe
    await this.validateItemExists(input.itemId, input.type);

    const favorite = await this.prisma.favorite.create({
      data: {
        userId: input.userId,
        itemId: input.itemId,
        type: input.type,
        listId: input.listId || null,
        notes: input.notes || null,
        tags: input.tags || []
      },
      include: {
        list: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Atualizar contador da lista se especificada
    if (input.listId) {
      await this.updateListCount(input.listId);
    }

    await HistoryHelper.logAction(
      HistoryEntity.FAVORITE,
      favorite.id,
      HistoryAction.CREATE,
      `Item favoritado: ${input.type} ${input.itemId}`,
      { userId: input.userId },
      { itemId: input.itemId, type: input.type, listId: input.listId }
    );

    return this.formatFavorite(favorite);
  }

  async updateFavorite(id: string, input: UpdateFavoriteInput, userId: string): Promise<Favorite> {
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: { id },
      include: { list: true }
    });

    if (!existingFavorite) {
      throw new Error('Favorito não encontrado');
    }

    if (existingFavorite.userId !== userId) {
      throw new Error('Acesso negado');
    }

    const oldListId = existingFavorite.listId;
    const newListId = input.listId;

    const favorite = await this.prisma.favorite.update({
      where: { id },
      data: {
        ...(input.listId !== undefined && { listId: input.listId }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.isActive !== undefined && { isActive: input.isActive })
      },
      include: {
        list: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Atualizar contadores das listas se necessário
    if (oldListId !== newListId) {
      if (oldListId) await this.updateListCount(oldListId);
      if (newListId) await this.updateListCount(newListId);
    }

    await HistoryHelper.logAction(
      HistoryEntity.FAVORITE,
      favorite.id,
      HistoryAction.UPDATE,
      `Favorito atualizado`,
      { userId },
      { changes: input }
    );

    return this.formatFavorite(favorite);
  }

  async deleteFavorite(id: string, userId: string): Promise<void> {
    const favorite = await this.prisma.favorite.findUnique({
      where: { id }
    });

    if (!favorite) {
      throw new Error('Favorito não encontrado');
    }

    if (favorite.userId !== userId) {
      throw new Error('Acesso negado');
    }

    await this.prisma.favorite.delete({
      where: { id }
    });

    // Atualizar contador da lista
    if (favorite.listId) {
      await this.updateListCount(favorite.listId);
    }

    await HistoryHelper.logAction(
      HistoryEntity.FAVORITE,
      id,
      HistoryAction.DELETE,
      `Favorito removido`,
      { userId },
      { itemId: favorite.itemId, type: favorite.type }
    );
  }

  async getFavoriteById(id: string, userId: string): Promise<Favorite | null> {
    const favorite = await this.prisma.favorite.findUnique({
      where: { id },
      include: {
        list: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!favorite || favorite.userId !== userId) {
      return null;
    }

    return this.formatFavorite(favorite);
  }

  async getFavorites(filter: FavoriteFilter): Promise<FavoriteListResponse> {
    const { page = 1, limit = 10 } = filter;
    const where: any = {};

    if (filter.userId) where.userId = filter.userId;
    if (filter.type) where.type = filter.type;
    if (filter.listId) where.listId = filter.listId;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.tags && filter.tags.length > 0) {
      where.tags = { hasSome: filter.tags };
    }

    const [favorites, total] = await this.prisma.$transaction([
      this.prisma.favorite.findMany({
        where,
        include: {
          list: true,
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.favorite.count({ where })
    ]);

    return {
      favorites: favorites.map(this.formatFavorite),
      total,
      page,
      limit
    };
  }

  // ===== FAVORITE LISTS CRUD =====

  async createFavoriteList(input: CreateFavoriteListInput): Promise<FavoriteList> {
    const list = await this.prisma.favoriteList.create({
      data: {
        userId: input.userId,
        name: input.name,
        description: input.description || null,
        isPublic: input.isPublic || false,
        tags: input.tags || [],
        color: input.color || null
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        favorites: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    await HistoryHelper.logAction(
      HistoryEntity.FAVORITE_LIST,
      list.id,
      HistoryAction.CREATE,
      `Lista de favoritos criada: ${list.name}`,
      { userId: input.userId },
      { name: list.name, isPublic: list.isPublic }
    );

    return this.formatFavoriteList(list);
  }

  async updateFavoriteList(id: string, input: UpdateFavoriteListInput, userId: string): Promise<FavoriteList> {
    const existingList = await this.prisma.favoriteList.findUnique({
      where: { id }
    });

    if (!existingList) {
      throw new Error('Lista não encontrada');
    }

    if (existingList.userId !== userId) {
      throw new Error('Acesso negado');
    }

    const list = await this.prisma.favoriteList.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.color !== undefined && { color: input.color })
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        favorites: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    await HistoryHelper.logAction(
      HistoryEntity.FAVORITE_LIST,
      list.id,
      HistoryAction.UPDATE,
      `Lista de favoritos atualizada: ${list.name}`,
      { userId },
      { changes: input }
    );

    return this.formatFavoriteList(list);
  }

  async deleteFavoriteList(id: string, userId: string): Promise<void> {
    const list = await this.prisma.favoriteList.findUnique({
      where: { id }
    });

    if (!list) {
      throw new Error('Lista não encontrada');
    }

    if (list.userId !== userId) {
      throw new Error('Acesso negado');
    }

    // Remover todos os favoritos da lista primeiro
    await this.prisma.favorite.deleteMany({
      where: { listId: id }
    });

    await this.prisma.favoriteList.delete({
      where: { id }
    });

    await HistoryHelper.logAction(
      HistoryEntity.FAVORITE_LIST,
      id,
      HistoryAction.DELETE,
      `Lista de favoritos deletada: ${list.name}`,
      { userId },
      { name: list.name }
    );
  }

  async getFavoriteListById(id: string, userId?: string): Promise<FavoriteList | null> {
    const list = await this.prisma.favoriteList.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        favorites: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!list) {
      return null;
    }

    // Se não é pública e não é do usuário, negar acesso
    if (!list.isPublic && (!userId || list.userId !== userId)) {
      return null;
    }

    return this.formatFavoriteList(list);
  }

  async getFavoriteLists(filter: FavoriteListFilter): Promise<FavoriteListListResponse> {
    const { page = 1, limit = 10 } = filter;
    const where: any = {};

    if (filter.userId) where.userId = filter.userId;
    if (filter.isPublic !== undefined) where.isPublic = filter.isPublic;
    if (filter.tags && filter.tags.length > 0) {
      where.tags = { hasSome: filter.tags };
    }

    const [lists, total] = await this.prisma.$transaction([
      this.prisma.favoriteList.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          favorites: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.favoriteList.count({ where })
    ]);

    return {
      lists: lists.map(this.formatFavoriteList),
      total,
      page,
      limit
    };
  }

  // ===== STATISTICS & ANALYTICS =====

  async getFavoriteStats(userId?: string): Promise<FavoriteStats> {
    const where = userId ? { userId } : {};

    const totalFavorites = await this.prisma.favorite.count({ where });

    const favoritesByType = await this.prisma.favorite.groupBy({
      by: ['type'],
      _count: { type: true },
      where,
      orderBy: { _count: { type: 'desc' } }
    });

    // Estatísticas de lojas mais favoritadas
    const storeFavorites = await this.prisma.favorite.groupBy({
      by: ['itemId'],
      _count: { itemId: true },
      where: { ...where, type: FavoriteType.STORE },
      orderBy: { _count: { itemId: 'desc' } },
      take: 10
    });

    const mostFavoritedStores = await Promise.all(
      storeFavorites.map(async (fav) => {
        const store = await this.prisma.store.findUnique({
          where: { id: fav.itemId },
          select: { id: true, name: true }
        });
        return {
          storeId: fav.itemId,
          storeName: store?.name || 'Loja não encontrada',
          favoriteCount: fav._count.itemId
        };
      })
    );

    // Estatísticas de produtos mais favoritados
    const productFavorites = await this.prisma.favorite.groupBy({
      by: ['itemId'],
      _count: { itemId: true },
      where: { ...where, type: FavoriteType.PRODUCT },
      orderBy: { _count: { itemId: 'desc' } },
      take: 10
    });

    const mostFavoritedProducts = await Promise.all(
      productFavorites.map(async (fav) => {
        const product = await this.prisma.product.findUnique({
          where: { id: fav.itemId },
          select: { id: true, name: true }
        });
        return {
          productId: fav.itemId,
          productName: product?.name || 'Produto não encontrado',
          favoriteCount: fav._count.itemId
        };
      })
    );

    // Estatísticas do usuário
    const userStats = userId ? await this.getUserStats(userId) : {
      totalLists: 0,
      publicLists: 0,
      privateLists: 0,
      averageFavoritesPerList: 0
    };

    return {
      totalFavorites,
      favoritesByType: favoritesByType.map(item => ({
        type: item.type,
        count: item._count.type
      })),
      mostFavoritedStores,
      mostFavoritedProducts,
      userStats
    };
  }

  async getFavoriteAnalytics(startDate: Date, endDate: Date): Promise<FavoriteAnalytics> {
    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    const totalFavorites = await this.prisma.favorite.count();
    const newFavorites = await this.prisma.favorite.count({ where });
    const removedFavorites = await this.prisma.favorite.count({
      where: {
        ...where,
        isActive: false
      }
    });

    // Favoritos por dia (simplificado)
    const startDateStr: string = startDate.toISOString().split('T')[0] || '';
    const endDateStr: string = endDate.toISOString().split('T')[0] || '';
    const favoritesByDay: Array<{ date: string; count: number }> = [
      { date: startDateStr, count: Math.floor(Math.random() * 10) },
      { date: endDateStr, count: Math.floor(Math.random() * 10) }
    ];

    // Top categorias (simulado)
    const topCategories = [
      { category: 'Restaurantes', count: Math.floor(Math.random() * 100) },
      { category: 'Fast Food', count: Math.floor(Math.random() * 80) },
      { category: 'Pizzarias', count: Math.floor(Math.random() * 60) }
    ];

    // Engajamento do usuário
    const activeUsers = await this.prisma.user.count({
      where: {
        favorites: {
          some: where
        }
      }
    });

    const averageFavoritesPerUser = activeUsers > 0 ? newFavorites / activeUsers : 0;

    const mostActiveUsers = await this.prisma.favorite.groupBy({
      by: ['userId'],
      _count: { userId: true },
      where,
      orderBy: { _count: { userId: 'desc' } },
      take: 10
    });

    const formattedActiveUsers = await Promise.all(
      mostActiveUsers.map(async (user) => {
        const userData = await this.prisma.user.findUnique({
          where: { id: user.userId },
          select: { id: true, name: true }
        });
        return {
          userId: user.userId,
          userName: userData?.name || 'Usuário não encontrado',
          favoriteCount: user._count.userId
        };
      })
    );

    return {
      period: { start: startDate, end: endDate },
      totalFavorites,
      newFavorites,
      removedFavorites,
      favoritesByDay,
      topCategories,
      userEngagement: {
        activeUsers,
        averageFavoritesPerUser,
        mostActiveUsers: formattedActiveUsers
      }
    };
  }

  // ===== RECOMMENDATIONS =====

  async getRecommendations(userId: string, limit: number = 10): Promise<FavoriteRecommendation[]> {
    const userFavorites = await this.prisma.favorite.findMany({
      where: { userId, isActive: true },
      include: { list: true }
    });

    const recommendations: FavoriteRecommendation[] = [];

    // Recomendações baseadas em lojas similares
    const storeFavorites = userFavorites.filter(fav => fav.type === FavoriteType.STORE);
    if (storeFavorites.length > 0) {
      const similarStores = await this.getSimilarStores(storeFavorites.map(fav => fav.itemId));
      recommendations.push(...similarStores.slice(0, limit / 2));
    }

    // Recomendações baseadas em produtos similares
    const productFavorites = userFavorites.filter(fav => fav.type === FavoriteType.PRODUCT);
    if (productFavorites.length > 0) {
      const similarProducts = await this.getSimilarProducts(productFavorites.map(fav => fav.itemId));
      recommendations.push(...similarProducts.slice(0, limit / 2));
    }

    return recommendations.slice(0, limit);
  }

  // ===== EXPORT =====

  async exportFavorites(userId: string, format: 'json' | 'csv'): Promise<FavoriteExport> {
    const [lists, favorites] = await Promise.all([
      this.prisma.favoriteList.findMany({
        where: { userId },
        include: {
          favorites: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      }),
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          list: true,
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    ]);

    return {
      format,
      data: {
        lists: lists.map(this.formatFavoriteList),
        favorites: favorites.map(this.formatFavorite),
        metadata: {
          exportDate: new Date(),
          totalLists: lists.length,
          totalFavorites: favorites.length
        }
      }
    };
  }

  // ===== HELPER METHODS =====

  private async validateItemExists(itemId: string, type: FavoriteType): Promise<void> {
    if (type === FavoriteType.STORE) {
      const store = await this.prisma.store.findUnique({ where: { id: itemId } });
      if (!store) {
        throw new Error('Loja não encontrada');
      }
    } else if (type === FavoriteType.PRODUCT) {
      const product = await this.prisma.product.findUnique({ where: { id: itemId } });
      if (!product) {
        throw new Error('Produto não encontrado');
      }
    }
  }

  private async updateListCount(listId: string): Promise<void> {
    const count = await this.prisma.favorite.count({
      where: { listId, isActive: true }
    });

    await this.prisma.favoriteList.update({
      where: { id: listId },
      data: { itemCount: count }
    });
  }

  private async getUserStats(userId: string) {
    const [totalLists, publicLists, privateLists, totalFavorites] = await Promise.all([
      this.prisma.favoriteList.count({ where: { userId } }),
      this.prisma.favoriteList.count({ where: { userId, isPublic: true } }),
      this.prisma.favoriteList.count({ where: { userId, isPublic: false } }),
      this.prisma.favorite.count({ where: { userId, isActive: true } })
    ]);

    return {
      totalLists,
      publicLists,
      privateLists,
      averageFavoritesPerList: totalLists > 0 ? totalFavorites / totalLists : 0
    };
  }

  private async getSimilarStores(storeIds: string[]): Promise<FavoriteRecommendation[]> {
    // Implementação simplificada - em produção usar algoritmos de recomendação
    const stores = await this.prisma.store.findMany({
      where: {
        id: { notIn: storeIds }
      },
      take: 5
    });

    return stores.map(store => ({
      type: 'store' as const,
      itemId: store.id,
      itemName: store.name,
      reason: 'Baseado nas suas lojas favoritas',
      confidence: Math.random() * 0.5 + 0.5,
      metadata: { category: 'similar' }
    }));
  }

  private async getSimilarProducts(productIds: string[]): Promise<FavoriteRecommendation[]> {
    // Implementação simplificada - em produção usar algoritmos de recomendação
    const products = await this.prisma.product.findMany({
      where: {
        id: { notIn: productIds }
      },
      take: 5
    });

    return products.map(product => ({
      type: 'product' as const,
      itemId: product.id,
      itemName: product.name,
      reason: 'Baseado nos seus produtos favoritos',
      confidence: Math.random() * 0.5 + 0.5,
      metadata: { category: 'similar' }
    }));
  }

  private formatFavorite(favorite: any): Favorite {
    return {
      id: favorite.id,
      userId: favorite.userId,
      itemId: favorite.itemId,
      type: favorite.type,
      listId: favorite.listId || undefined,
      notes: favorite.notes || undefined,
      tags: favorite.tags || [],
      isActive: favorite.isActive,
      createdAt: favorite.createdAt,
      updatedAt: favorite.updatedAt,
      list: favorite.list ? this.formatFavoriteList(favorite.list) : undefined,
      user: favorite.user
    };
  }

  private formatFavoriteList(list: any): FavoriteList {
    return {
      id: list.id,
      userId: list.userId,
      name: list.name,
      description: list.description || undefined,
      isPublic: list.isPublic,
      tags: list.tags || [],
      color: list.color || undefined,
      itemCount: list.itemCount,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      favorites: list.favorites ? list.favorites.map(this.formatFavorite) : [],
      user: list.user
    };
  }
}

export const getFavoriteService = (prismaInstance: PrismaClient) => {
  return new FavoriteService(prismaInstance);
};
