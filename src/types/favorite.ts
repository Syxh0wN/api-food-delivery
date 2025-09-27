import { FavoriteType } from '@prisma/client';

export interface CreateFavoriteInput {
  userId: string;
  itemId: string;
  type: FavoriteType;
  listId?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateFavoriteInput {
  listId?: string;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface Favorite {
  id: string;
  userId: string;
  itemId: string;
  type: FavoriteType;
  listId?: string;
  notes?: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relacionamentos
  item?: any; // Store ou Product
  list?: FavoriteList | undefined;
  user?: any;
}

export interface CreateFavoriteListInput {
  userId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  color?: string;
}

export interface UpdateFavoriteListInput {
  name?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  color?: string;
}

export interface FavoriteList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  tags: string[];
  color?: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relacionamentos
  favorites: Favorite[];
  user?: any;
}

export interface FavoriteStats {
  totalFavorites: number;
  favoritesByType: Array<{
    type: FavoriteType;
    count: number;
  }>;
  mostFavoritedStores: Array<{
    storeId: string;
    storeName: string;
    favoriteCount: number;
  }>;
  mostFavoritedProducts: Array<{
    productId: string;
    productName: string;
    favoriteCount: number;
  }>;
  userStats: {
    totalLists: number;
    publicLists: number;
    privateLists: number;
    averageFavoritesPerList: number;
  };
}

export interface FavoriteRecommendation {
  type: 'store' | 'product';
  itemId: string;
  itemName: string;
  reason: string;
  confidence: number; // 0-1
  metadata?: any;
}

export interface FavoriteFilter {
  userId?: string;
  type?: FavoriteType;
  listId?: string;
  isActive?: boolean;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface FavoriteListFilter {
  userId?: string;
  isPublic?: boolean;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface FavoriteListResponse {
  favorites: Favorite[];
  total: number;
  page: number;
  limit: number;
}

export interface FavoriteListListResponse {
  lists: FavoriteList[];
  total: number;
  page: number;
  limit: number;
}

export interface FavoriteAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  totalFavorites: number;
  newFavorites: number;
  removedFavorites: number;
  favoritesByDay: Array<{
    date: string;
    count: number;
  }>;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  userEngagement: {
    activeUsers: number;
    averageFavoritesPerUser: number;
    mostActiveUsers: Array<{
      userId: string;
      userName: string;
      favoriteCount: number;
    }>;
  };
}

export interface FavoriteExport {
  format: 'json' | 'csv';
  data: {
    lists: FavoriteList[];
    favorites: Favorite[];
    metadata: {
      exportDate: Date;
      totalLists: number;
      totalFavorites: number;
    };
  };
}
