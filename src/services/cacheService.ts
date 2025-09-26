import { getRedisClient, isRedisConnected } from '../config/redis';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export class CacheService {
  private static instance: CacheService;
  private defaultTTL = 3600;

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private getKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  private async getClient() {
    const client = getRedisClient();
    if (!client || !isRedisConnected()) {
      return null;
    }
    return client;
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) {
        return false;
      }

      const cacheKey = this.getKey(key, options.prefix);
      const serializedValue = JSON.stringify(value);
      const ttl = options.ttl || this.defaultTTL;

      await client.setEx(cacheKey, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async get<T = any>(key: string, prefix?: string): Promise<T | null> {
    try {
      const client = await this.getClient();
      if (!client) {
        return null;
      }

      const cacheKey = this.getKey(key, prefix);
      const value = await client.get(cacheKey);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async del(key: string, prefix?: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) {
        return false;
      }

      const cacheKey = this.getKey(key, prefix);
      const result = await client.del(cacheKey);
      return result > 0;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  }

  async exists(key: string, prefix?: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) {
        return false;
      }

      const cacheKey = this.getKey(key, prefix);
      const result = await client.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async expire(key: string, ttl: number, prefix?: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) {
        return false;
      }

      const cacheKey = this.getKey(key, prefix);
      const result = await client.expire(cacheKey, ttl);
      return result === 1;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  async ttl(key: string, prefix?: string): Promise<number> {
    try {
      const client = await this.getClient();
      if (!client) {
        return -1;
      }

      const cacheKey = this.getKey(key, prefix);
      return await client.ttl(cacheKey);
    } catch (error) {
      console.error('Cache ttl error:', error);
      return -1;
    }
  }

  async flushPattern(pattern: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) {
        return false;
      }

      const keys = await client.keys(pattern);
      if (keys.length === 0) {
        return true;
      }

      await client.del(keys);
      return true;
    } catch (error) {
      console.error('Cache flush pattern error:', error);
      return false;
    }
  }

  async flushAll(): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) {
        return false;
      }

      await client.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush all error:', error);
      return false;
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    memory: any;
    info: any;
  }> {
    try {
      const client = await this.getClient();
      if (!client) {
        return {
          connected: false,
          memory: null,
          info: null
        };
      }

      const memory = await client.memoryUsage('test-key');
      const info = await client.info('memory');

      return {
        connected: true,
        memory,
        info
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        connected: false,
        memory: null,
        info: null
      };
    }
  }
}

export const cacheService = CacheService.getInstance();

export const CacheKeys = {
  PRODUCTS: 'products',
  PRODUCT_BY_ID: 'product',
  PRODUCTS_BY_STORE: 'store_products',
  PRODUCTS_BY_CATEGORY: 'category_products',
  STORES: 'stores',
  STORE_BY_ID: 'store',
  STORES_BY_CATEGORY: 'category_stores',
  CATEGORIES: 'categories',
  CATEGORY_BY_ID: 'category',
  USER_BY_ID: 'user',
  USER_PROFILE: 'user_profile',
  CART_BY_USER: 'user_cart',
  ORDERS_BY_USER: 'user_orders',
  ORDERS_BY_STORE: 'store_orders',
  REVIEWS_BY_STORE: 'store_reviews',
  REVIEWS_BY_PRODUCT: 'product_reviews'
} as const;
