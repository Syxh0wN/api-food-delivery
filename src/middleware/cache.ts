import { Request, Response, NextFunction } from 'express';
import { cacheService, CacheKeys } from '../services/cacheService';

export interface CacheMiddlewareOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  prefix?: string;
  skipCache?: (req: Request) => boolean;
}

export const cacheMiddleware = (options: CacheMiddlewareOptions = {}) => {
  const {
    ttl = 3600,
    keyGenerator,
    prefix,
    skipCache
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (skipCache && skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator ? keyGenerator(req) : generateDefaultKey(req);
    const fullKey = prefix ? `${prefix}:${cacheKey}` : cacheKey;

    try {
      const cachedData = await cacheService.get(fullKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          cached: true
        });
      }

      const originalSend = res.json;
      res.json = function(data: any) {
        if (data.success && data.data) {
          const cacheOptions: any = { ttl };
          if (prefix) {
            cacheOptions.prefix = prefix;
          }
          cacheService.set(fullKey, data.data, cacheOptions);
        }
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

const generateDefaultKey = (req: Request): string => {
  const { method, originalUrl, query, params } = req;
  const queryString = Object.keys(query).length > 0 ? JSON.stringify(query) : '';
  const paramsString = Object.keys(params).length > 0 ? JSON.stringify(params) : '';
  
  return `${method}:${originalUrl}:${queryString}:${paramsString}`;
};

export const cacheProductMiddleware = cacheMiddleware({
  ttl: 1800,
  prefix: CacheKeys.PRODUCTS,
  keyGenerator: (req) => {
    const { id } = req.params;
    const { page, limit, category, store } = req.query;
    return `list:${page || 1}:${limit || 10}:${category || 'all'}:${store || 'all'}`;
  }
});

export const cacheStoreMiddleware = cacheMiddleware({
  ttl: 1800,
  prefix: CacheKeys.STORES,
  keyGenerator: (req) => {
    const { id } = req.params;
    const { page, limit, category, search } = req.query;
    return `list:${page || 1}:${limit || 10}:${category || 'all'}:${search || 'all'}`;
  }
});

export const cacheCategoryMiddleware = cacheMiddleware({
  ttl: 3600,
  prefix: CacheKeys.CATEGORIES,
  keyGenerator: (req) => {
    const { id } = req.params;
    return id ? `single:${id}` : 'list:all';
  }
});

export const cacheUserMiddleware = cacheMiddleware({
  ttl: 900,
  prefix: CacheKeys.USER_BY_ID,
  keyGenerator: (req) => {
    const { id } = req.params;
    return `profile:${id}`;
  }
});

export const cacheOrderMiddleware = cacheMiddleware({
  ttl: 600,
  prefix: 'orders',
  keyGenerator: (req) => {
    const { id } = req.params;
    const { page, limit, status } = req.query;
    return id ? `single:${id}` : `list:${page || 1}:${limit || 10}:${status || 'all'}`;
  }
});

export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    await cacheService.flushPattern(pattern);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

export const invalidateProductCache = async (productId?: string): Promise<void> => {
  if (productId) {
    await invalidateCache(`${CacheKeys.PRODUCTS}:*`);
    await invalidateCache(`${CacheKeys.PRODUCT_BY_ID}:${productId}:*`);
  } else {
    await invalidateCache(`${CacheKeys.PRODUCTS}:*`);
  }
};

export const invalidateStoreCache = async (storeId?: string): Promise<void> => {
  if (storeId) {
    await invalidateCache(`${CacheKeys.STORES}:*`);
    await invalidateCache(`${CacheKeys.STORE_BY_ID}:${storeId}:*`);
  } else {
    await invalidateCache(`${CacheKeys.STORES}:*`);
  }
};

export const invalidateCategoryCache = async (): Promise<void> => {
  await invalidateCache(`${CacheKeys.CATEGORIES}:*`);
};

export const invalidateUserCache = async (userId?: string): Promise<void> => {
  if (userId) {
    await invalidateCache(`${CacheKeys.USER_BY_ID}:*`);
    await invalidateCache(`${CacheKeys.USER_PROFILE}:${userId}:*`);
  } else {
    await invalidateCache(`${CacheKeys.USER_BY_ID}:*`);
  }
};

export const invalidateOrderCache = async (orderId?: string): Promise<void> => {
  if (orderId) {
    await invalidateCache('orders:*');
  } else {
    await invalidateCache('orders:*');
  }
};
