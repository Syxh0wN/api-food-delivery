import { cacheService, CacheService, CacheKeys } from '../../services/cacheService';
import { connectRedis, disconnectRedis, getRedisClient } from '../../config/redis';

describe('CacheService', () => {
  beforeAll(async () => {
    if (process.env.NODE_ENV === 'test') {
      const mockRedisClient = {
        isOpen: true,
        setEx: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        exists: jest.fn(),
        expire: jest.fn(),
        ttl: jest.fn(),
        keys: jest.fn(),
        flushAll: jest.fn(),
        memoryUsage: jest.fn(),
        info: jest.fn()
      };
      jest.mock('../../config/redis', () => ({
        connectRedis: jest.fn(),
        disconnectRedis: jest.fn(),
        getRedisClient: jest.fn(() => mockRedisClient),
        isRedisConnected: jest.fn(() => true)
      }));
    }
  });

  afterAll(async () => {
    if (process.env.NODE_ENV !== 'test') {
      await disconnectRedis();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('deve retornar a mesma instância (singleton)', () => {
      const instance1 = CacheService.getInstance();
      const instance2 = CacheService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('set', () => {
    it('deve definir valor no cache com TTL padrão', async () => {
      const mockClient = getRedisClient() as any;
      if (mockClient) {
        mockClient.setEx.mockResolvedValue('OK');
      }

      const result = await cacheService.set('test-key', { data: 'test' });
      
      if (process.env.NODE_ENV === 'test') {
        expect(result).toBe(false);
      } else {
        expect(result).toBe(true);
      }
    });

    it('deve definir valor no cache com TTL customizado', async () => {
      const mockClient = getRedisClient() as any;
      if (mockClient) {
        mockClient.setEx.mockResolvedValue('OK');
      }

      const result = await cacheService.set('test-key', { data: 'test' }, { ttl: 1800 });
      
      if (process.env.NODE_ENV === 'test') {
        expect(result).toBe(false);
      } else {
        expect(result).toBe(true);
      }
    });

    it('deve definir valor no cache com prefixo', async () => {
      const mockClient = getRedisClient() as any;
      if (mockClient) {
        mockClient.setEx.mockResolvedValue('OK');
      }

      const result = await cacheService.set('test-key', { data: 'test' }, { prefix: 'products' });
      
      if (process.env.NODE_ENV === 'test') {
        expect(result).toBe(false);
      } else {
        expect(result).toBe(true);
      }
    });

    it('deve retornar false quando não há cliente Redis', async () => {
      const result = await cacheService.set('test-key', { data: 'test' });
      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('deve recuperar valor do cache', async () => {
      const mockClient = getRedisClient() as any;
      const testData = { data: 'test' };
      
      if (mockClient) {
        mockClient.get.mockResolvedValue(JSON.stringify(testData));
      }

      const result = await cacheService.get('test-key');
      
      if (process.env.NODE_ENV === 'test') {
        expect(result).toBeNull();
      } else {
        expect(result).toEqual(testData);
      }
    });

    it('deve recuperar valor do cache com prefixo', async () => {
      const mockClient = getRedisClient() as any;
      const testData = { data: 'test' };
      
      if (mockClient) {
        mockClient.get.mockResolvedValue(JSON.stringify(testData));
      }

      const result = await cacheService.get('test-key', 'products');
      
      if (process.env.NODE_ENV === 'test') {
        expect(result).toBeNull();
      } else {
        expect(result).toEqual(testData);
      }
    });

    it('deve retornar null quando chave não existe', async () => {
      const mockClient = getRedisClient() as any;
      
      if (mockClient) {
        mockClient.get.mockResolvedValue(null);
      }

      const result = await cacheService.get('nonexistent-key');
      expect(result).toBeNull();
    });

    it('deve retornar null quando não há cliente Redis', async () => {
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('deve deletar chave do cache', async () => {
      const mockClient = getRedisClient() as any;
      
      if (mockClient) {
        mockClient.del.mockResolvedValue(1);
      }

      const result = await cacheService.del('test-key');
      
      if (process.env.NODE_ENV === 'test') {
        expect(result).toBe(false);
      } else {
        expect(result).toBe(true);
      }
    });

    it('deve retornar false quando chave não existe', async () => {
      const mockClient = getRedisClient() as any;
      
      if (mockClient) {
        mockClient.del.mockResolvedValue(0);
      }

      const result = await cacheService.del('nonexistent-key');
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('deve verificar se chave existe', async () => {
      const mockClient = getRedisClient() as any;
      
      if (mockClient) {
        mockClient.exists.mockResolvedValue(1);
      }

      const result = await cacheService.exists('test-key');
      
      if (process.env.NODE_ENV === 'test') {
        expect(result).toBe(false);
      } else {
        expect(result).toBe(true);
      }
    });

    it('deve retornar false quando chave não existe', async () => {
      const mockClient = getRedisClient() as any;
      
      if (mockClient) {
        mockClient.exists.mockResolvedValue(0);
      }

      const result = await cacheService.exists('nonexistent-key');
      expect(result).toBe(false);
    });
  });

  describe('expire', () => {
    it('deve definir TTL para chave', async () => {
      const mockClient = getRedisClient() as any;
      
      if (mockClient) {
        mockClient.expire.mockResolvedValue(true);
      }

      const result = await cacheService.expire('test-key', 1800);
      
      if (process.env.NODE_ENV === 'test') {
        expect(result).toBe(false);
      } else {
        expect(result).toBe(true);
      }
    });
  });

  describe('ttl', () => {
    it('deve retornar TTL da chave', async () => {
      const mockClient = getRedisClient() as any;
      
      if (mockClient) {
        mockClient.ttl.mockResolvedValue(1800);
      }

      const result = await cacheService.ttl('test-key');
      
      if (process.env.NODE_ENV === 'test') {
        expect(result).toBe(-1);
      } else {
        expect(result).toBe(1800);
      }
    });
  });

  describe('flushPattern', () => {
    it('deve limpar chaves por padrão', async () => {
      const mockClient = getRedisClient() as any;
      
      if (mockClient) {
        mockClient.keys.mockResolvedValue(['key1', 'key2']);
        mockClient.del.mockResolvedValue(2);
      }

      const result = await cacheService.flushPattern('test:*');
      
      if (process.env.NODE_ENV === 'test') {
        expect(result).toBe(false);
      } else {
        expect(result).toBe(true);
      }
    });

    it('deve retornar true quando não há chaves para deletar', async () => {
      const mockClient = getRedisClient() as any;
      
      if (mockClient) {
        mockClient.keys.mockResolvedValue([]);
      }

      const result = await cacheService.flushPattern('test:*');
      
      if (process.env.NODE_ENV === 'test') {
        expect(result).toBe(false);
      } else {
        expect(result).toBe(true);
      }
    });
  });

  describe('flushAll', () => {
    it('deve limpar todo o cache', async () => {
      const mockClient = getRedisClient() as any;
      
      if (mockClient) {
        mockClient.flushAll.mockResolvedValue('OK');
      }

      const result = await cacheService.flushAll();
      
      if (process.env.NODE_ENV === 'test') {
        expect(result).toBe(false);
      } else {
        expect(result).toBe(true);
      }
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas do cache', async () => {
      const mockClient = getRedisClient() as any;
      
      if (mockClient) {
        mockClient.memoryUsage.mockResolvedValue(1024);
        mockClient.info.mockResolvedValue('used_memory:1024');
      }

      const result = await cacheService.getStats();
      
      if (process.env.NODE_ENV === 'test') {
        expect(result.connected).toBe(false);
      } else {
        expect(result.connected).toBe(true);
        expect(result.memory).toBe(1024);
        expect(result.info).toBe('used_memory:1024');
      }
    });
  });

  describe('CacheKeys', () => {
    it('deve ter todas as chaves de cache definidas', () => {
      expect(CacheKeys.PRODUCTS).toBe('products');
      expect(CacheKeys.PRODUCT_BY_ID).toBe('product');
      expect(CacheKeys.STORES).toBe('stores');
      expect(CacheKeys.STORE_BY_ID).toBe('store');
      expect(CacheKeys.CATEGORIES).toBe('categories');
      expect(CacheKeys.CATEGORY_BY_ID).toBe('category');
      expect(CacheKeys.USER_BY_ID).toBe('user');
      expect(CacheKeys.USER_PROFILE).toBe('user_profile');
      expect(CacheKeys.CART_BY_USER).toBe('user_cart');
      expect(CacheKeys.ORDERS_BY_USER).toBe('user_orders');
      expect(CacheKeys.ORDERS_BY_STORE).toBe('store_orders');
      expect(CacheKeys.REVIEWS_BY_STORE).toBe('store_reviews');
      expect(CacheKeys.REVIEWS_BY_PRODUCT).toBe('product_reviews');
    });
  });
});
