import request from 'supertest';
import express from 'express';
import { cacheMiddleware, invalidateCache, invalidateProductCache } from '../../middleware/cache';
import { cacheService } from '../../services/cacheService';

jest.mock('../../services/cacheService');

const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;

describe('Cache Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    jest.clearAllMocks();
  });

  describe('cacheMiddleware', () => {
    it('deve retornar dados do cache quando disponível', async () => {
      const cachedData = { id: 1, name: 'Test Product' };
      mockCacheService.get.mockResolvedValue(cachedData);

      app.get('/test', cacheMiddleware(), (req, res) => {
        res.json({
          success: true,
          data: { id: 2, name: 'Fresh Data' }
        });
      });

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: cachedData,
        cached: true
      });

      expect(mockCacheService.get).toHaveBeenCalled();
    });

    it('deve executar próximo middleware quando cache não está disponível', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue(true);

      const freshData = { id: 2, name: 'Fresh Data' };

      app.get('/test', cacheMiddleware(), (req, res) => {
        res.json({
          success: true,
          data: freshData
        });
      });

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: freshData
      });

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('deve pular cache quando skipCache retorna true', async () => {
      const freshData = { id: 2, name: 'Fresh Data' };

      app.get('/test', cacheMiddleware({
        skipCache: (req) => req.query.skip === 'true'
      }), (req, res) => {
        res.json({
          success: true,
          data: freshData
        });
      });

      const response = await request(app)
        .get('/test?skip=true')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: freshData
      });

      expect(mockCacheService.get).not.toHaveBeenCalled();
    });

    it('deve usar keyGenerator customizado', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue(true);

      const customKey = 'custom-key';
      const freshData = { id: 2, name: 'Fresh Data' };

      app.get('/test/:id', cacheMiddleware({
        keyGenerator: (req) => `product:${req.params.id}`
      }), (req, res) => {
        res.json({
          success: true,
          data: freshData
        });
      });

      await request(app)
        .get('/test/123')
        .expect(200);

      expect(mockCacheService.get).toHaveBeenCalledWith('product:123');
    });

    it('deve usar TTL customizado', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue(true);

      const customTtl = 900;
      const freshData = { id: 2, name: 'Fresh Data' };

      app.get('/test', cacheMiddleware({
        ttl: customTtl
      }), (req, res) => {
        res.json({
          success: true,
          data: freshData
        });
      });

      await request(app)
        .get('/test')
        .expect(200);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        freshData,
        { ttl: customTtl, prefix: undefined }
      );
    });

    it('deve usar prefixo customizado', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue(true);

      const prefix = 'products';
      const freshData = { id: 2, name: 'Fresh Data' };

      app.get('/test', cacheMiddleware({
        prefix
      }), (req, res) => {
        res.json({
          success: true,
          data: freshData
        });
      });

      await request(app)
        .get('/test')
        .expect(200);

      expect(mockCacheService.get).toHaveBeenCalledWith(expect.stringContaining('GET:/test'));
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        freshData,
        { ttl: 3600, prefix }
      );
    });

    it('deve continuar execução quando há erro no cache', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Cache error'));

      const freshData = { id: 2, name: 'Fresh Data' };

      app.get('/test', cacheMiddleware(), (req, res) => {
        res.json({
          success: true,
          data: freshData
        });
      });

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: freshData
      });
    });

    it('deve não cachear quando response não tem success: true', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue(true);

      app.get('/test', cacheMiddleware(), (req, res) => {
        res.json({
          success: false,
          message: 'Error occurred'
        });
      });

      await request(app)
        .get('/test')
        .expect(200);

      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('deve não cachear quando response não tem data', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue(true);

      app.get('/test', cacheMiddleware(), (req, res) => {
        res.json({
          success: true,
          message: 'No data to cache'
        });
      });

      await request(app)
        .get('/test')
        .expect(200);

      expect(mockCacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('invalidateCache', () => {
    it('deve invalidar cache por padrão', async () => {
      mockCacheService.flushPattern.mockResolvedValue(true);

      await invalidateCache('products:*');

      expect(mockCacheService.flushPattern).toHaveBeenCalledWith('products:*');
    });

    it('deve lidar com erro durante invalidação', async () => {
      mockCacheService.flushPattern.mockRejectedValue(new Error('Invalidation error'));

      await expect(invalidateCache('products:*')).resolves.not.toThrow();
    });
  });

  describe('invalidateProductCache', () => {
    it('deve invalidar cache específico do produto', async () => {
      mockCacheService.flushPattern.mockResolvedValue(true);

      await invalidateProductCache('product-id-123');

      expect(mockCacheService.flushPattern).toHaveBeenCalledWith('products:*');
      expect(mockCacheService.flushPattern).toHaveBeenCalledWith('product:product-id-123:*');
    });

    it('deve invalidar todo cache de produtos quando ID não é fornecido', async () => {
      mockCacheService.flushPattern.mockResolvedValue(true);

      await invalidateProductCache();

      expect(mockCacheService.flushPattern).toHaveBeenCalledWith('products:*');
      expect(mockCacheService.flushPattern).toHaveBeenCalledTimes(1);
    });
  });
});
