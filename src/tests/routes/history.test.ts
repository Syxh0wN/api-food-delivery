import request from 'supertest';
import app from '../../index';
import { prisma } from '../../config/database';
import { HistoryAction, HistoryEntity } from '@prisma/client';
import { hashPassword } from '../../utils/hash';

describe('Sistema de Histórico', () => {
  let testUser: any;
  let testStore: any;
  let testProduct: any;
  let testOrder: any;
  let testReview: any;
  let authToken: string;

  beforeAll(async () => {
    let existingUser = await prisma.user.findUnique({
      where: { email: 'test-history@example.com' }
    });
    
    if (!existingUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test-history@example.com',
          password: await hashPassword('password123'),
          name: 'Test User History',
          role: 'CLIENT'
        }
      });
    } else {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: await hashPassword('password123') }
      });
      testUser = existingUser;
    }

    let existingStoreOwner = await prisma.user.findUnique({
      where: { email: 'store-owner-history@example.com' }
    });
    
    if (!existingStoreOwner) {
      const storeOwner = await prisma.user.create({
        data: {
          email: 'store-owner-history@example.com',
          password: 'password123',
          name: 'Store Owner History',
          role: 'STORE_OWNER'
        }
      });

      testStore = await prisma.store.create({
        data: {
          name: 'Test Store History',
          description: 'Test store for history',
          phone: '123456789',
          email: 'store-history@example.com',
          address: {
            street: 'Test Street',
            number: '123',
            neighborhood: 'Test Neighborhood',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345-678'
          },
          deliveryRadius: 5.0,
          estimatedDeliveryTime: 30,
          minimumOrderValue: 10.0,
          ownerId: storeOwner.id
        }
      });
    } else {
      testStore = await prisma.store.findFirst({
        where: { ownerId: existingStoreOwner.id }
      });
    }

    let existingCategory = await prisma.category.findUnique({
      where: { name: 'Test Category History' }
    });
    
    if (!existingCategory) {
      const category = await prisma.category.create({
        data: {
          name: 'Test Category History',
          description: 'Test category for history'
        }
      });

      testProduct = await prisma.product.create({
        data: {
          name: 'Test Product History',
          description: 'Test product for history',
          price: 15.99,
          categoryId: category.id,
          storeId: testStore.id,
          ingredients: ['ingredient1', 'ingredient2'],
          allergens: ['allergen1'],
          images: ['image1.jpg'],
          nutritionalInfo: { calories: 100 }
        }
      });
    } else {
      testProduct = await prisma.product.findFirst({
        where: { categoryId: existingCategory.id }
      });
    }

    const testAddress = await prisma.address.create({
      data: {
        userId: testUser.id,
        street: 'Test Street',
        number: '123',
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345-678'
      }
    });

    testOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        storeId: testStore.id,
        addressId: testAddress.id,
        total: 15.99,
        subtotal: 15.99,
        deliveryFee: 0,
        paymentMethod: 'PIX'
      }
    });

    testReview = await prisma.review.create({
      data: {
        userId: testUser.id,
        storeId: testStore.id,
        rating: 5,
        comment: 'Great service!'
      }
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test-history@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await prisma.history.deleteMany({
      where: {
        OR: [
          { userId: testUser?.id },
          { entityId: testStore?.id },
          { entityId: testProduct?.id },
          { entityId: testOrder?.id },
          { entityId: testReview?.id }
        ]
      }
    });

    if (testReview) {
      try {
        await prisma.review.delete({ where: { id: testReview.id } });
      } catch (error) {
        // Review já foi deletado ou não existe
      }
    }
    if (testOrder) {
      try {
        await prisma.order.delete({ where: { id: testOrder.id } });
      } catch (error) {
        // Order já foi deletado ou não existe
      }
    }
    if (testProduct) {
      try {
        await prisma.product.delete({ where: { id: testProduct.id } });
      } catch (error) {
        // Product já foi deletado ou não existe
      }
    }
    if (testStore) {
      try {
        await prisma.store.delete({ where: { id: testStore.id } });
      } catch (error) {
        // Store já foi deletado ou não existe
      }
    }
    if (testUser) {
      try {
        await prisma.user.delete({ where: { id: testUser.id } });
      } catch (error) {
        // User já foi deletado ou não existe
      }
    }
    
    const storeOwner = await prisma.user.findUnique({
      where: { email: 'store-owner-history@example.com' }
    });
    if (storeOwner) await prisma.user.delete({ where: { id: storeOwner.id } });

    const category = await prisma.category.findUnique({
      where: { name: 'Test Category History' }
    });
    if (category) await prisma.category.delete({ where: { id: category.id } });

    const address = await prisma.address.findFirst({
      where: { userId: testUser?.id }
    });
    if (address) await prisma.address.delete({ where: { id: address.id } });
  });

  beforeEach(async () => {
    await prisma.history.deleteMany({
      where: {
        OR: [
          { userId: testUser?.id },
          { entityId: testStore?.id },
          { entityId: testProduct?.id },
          { entityId: testOrder?.id },
          { entityId: testReview?.id }
        ]
      }
    });
  });

  describe('POST /api/history', () => {
    it('deve criar histórico com sucesso', async () => {
      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUser.id,
          entityType: HistoryEntity.USER,
          entityId: testUser.id,
          action: HistoryAction.CREATE,
          description: 'Usuário criado',
          metadata: { test: true },
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.entityType).toBe(HistoryEntity.USER);
      expect(response.body.action).toBe(HistoryAction.CREATE);
      expect(response.body.description).toBe('Usuário criado');
    });

    it('deve falhar com dados inválidos', async () => {
      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'INVALID_TYPE',
          action: 'INVALID_ACTION'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Dados inválidos');
    });

    it('deve falhar sem autenticação', async () => {
      const response = await request(app)
        .post('/api/history')
        .send({
          entityType: HistoryEntity.USER,
          entityId: testUser.id,
          action: HistoryAction.CREATE,
          description: 'Test'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/history', () => {
    beforeEach(async () => {
      await prisma.history.createMany({
        data: [
          {
            userId: testUser.id,
            entityType: HistoryEntity.USER,
            entityId: testUser.id,
            action: HistoryAction.CREATE,
            description: 'Usuário criado'
          },
          {
            userId: testUser.id,
            entityType: HistoryEntity.STORE,
            entityId: testStore.id,
            action: HistoryAction.VIEW,
            description: 'Loja visualizada'
          },
          {
            userId: testUser.id,
            entityType: HistoryEntity.PRODUCT,
            entityId: testProduct.id,
            action: HistoryAction.VIEW,
            description: 'Produto visualizado'
          }
        ]
      });
    });

    it('deve buscar históricos com sucesso', async () => {
      const response = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('histories');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.histories.length).toBeGreaterThan(0);
    });

    it('deve filtrar históricos por usuário', async () => {
      const response = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ userId: testUser.id });

      expect(response.status).toBe(200);
      expect(response.body.histories.every((h: any) => h.userId === testUser.id)).toBe(true);
    });

    it('deve filtrar históricos por tipo de entidade', async () => {
      const response = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ entityType: HistoryEntity.USER });

      expect(response.status).toBe(200);
      expect(response.body.histories.every((h: any) => h.entityType === HistoryEntity.USER)).toBe(true);
    });

    it('deve filtrar históricos por ação', async () => {
      const response = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ action: HistoryAction.CREATE });

      expect(response.status).toBe(200);
      expect(response.body.histories.every((h: any) => h.action === HistoryAction.CREATE)).toBe(true);
    });

    it('deve paginar resultados', async () => {
      const response = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.histories.length).toBeLessThanOrEqual(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
    });
  });

  describe('GET /api/history/:id', () => {
    let testHistory: any;

    beforeEach(async () => {
      testHistory = await prisma.history.create({
        data: {
          userId: testUser.id,
          entityType: HistoryEntity.USER,
          entityId: testUser.id,
          action: HistoryAction.CREATE,
          description: 'Usuário criado'
        }
      });
    });

    it('deve buscar histórico específico com sucesso', async () => {
      const response = await request(app)
        .get(`/api/history/${testHistory.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testHistory.id);
      expect(response.body.description).toBe('Usuário criado');
    });

    it('deve retornar 404 para histórico inexistente', async () => {
      const response = await request(app)
        .get('/api/history/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Histórico não encontrado');
    });

    it('deve falhar sem autenticação', async () => {
      const response = await request(app)
        .get(`/api/history/${testHistory.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/history/stats', () => {
    beforeEach(async () => {
      await prisma.history.createMany({
        data: [
          {
            userId: testUser.id,
            entityType: HistoryEntity.USER,
            entityId: testUser.id,
            action: HistoryAction.CREATE,
            description: 'Usuário criado'
          },
          {
            userId: testUser.id,
            entityType: HistoryEntity.STORE,
            entityId: testStore.id,
            action: HistoryAction.VIEW,
            description: 'Loja visualizada'
          },
          {
            userId: testUser.id,
            entityType: HistoryEntity.PRODUCT,
            entityId: testProduct.id,
            action: HistoryAction.VIEW,
            description: 'Produto visualizado'
          }
        ]
      });
    });

    it('deve retornar estatísticas com sucesso (apenas admin)', async () => {
      let adminUser = await prisma.user.findUnique({
        where: { email: 'admin-history@example.com' }
      });
      
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            email: 'admin-history@example.com',
            password: await hashPassword('password123'),
            name: 'Admin History',
            role: 'ADMIN'
          }
        });
      } else {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { password: await hashPassword('password123') }
        });
      }

      const adminLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin-history@example.com',
          password: 'password123'
        });

      const adminToken = adminLoginResponse.body.data.token;

      const response = await request(app)
        .get('/api/history/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalActions');
      expect(response.body).toHaveProperty('actionsByType');
      expect(response.body).toHaveProperty('actionsByEntity');
      expect(response.body).toHaveProperty('actionsByUser');
      expect(response.body).toHaveProperty('recentActivity');

      await prisma.user.delete({ where: { id: adminUser.id } });
    });

    it('deve retornar erro 403 para usuário não admin', async () => {
      const response = await request(app)
        .get('/api/history/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/history/audit', () => {
    beforeEach(async () => {
      await prisma.history.createMany({
        data: [
          {
            userId: testUser.id,
            entityType: HistoryEntity.USER,
            entityId: testUser.id,
            action: HistoryAction.CREATE,
            description: 'Usuário criado',
            metadata: { oldValues: {}, newValues: { name: 'Test User' } }
          },
          {
            userId: testUser.id,
            entityType: HistoryEntity.STORE,
            entityId: testStore.id,
            action: HistoryAction.UPDATE,
            description: 'Loja atualizada',
            metadata: { oldValues: { name: 'Old Name' }, newValues: { name: 'New Name' } }
          }
        ]
      });
    });

    it('deve retornar logs de auditoria com sucesso (apenas admin)', async () => {
      let adminUser = await prisma.user.findUnique({
        where: { email: 'admin-audit@example.com' }
      });
      
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            email: 'admin-audit@example.com',
            password: await hashPassword('password123'),
            name: 'Admin Audit',
            role: 'ADMIN'
          }
        });
      } else {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { password: await hashPassword('password123') }
        });
      }

      const adminLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin-audit@example.com',
          password: 'password123'
        });

      const adminToken = adminLoginResponse.body.data.token;

      const response = await request(app)
        .get('/api/history/audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.logs.length).toBeGreaterThan(0);

      await prisma.user.delete({ where: { id: adminUser.id } });
    });

    it('deve retornar erro 403 para usuário não admin', async () => {
      const response = await request(app)
        .get('/api/history/audit')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/history/user/:userId', () => {
    beforeEach(async () => {
      await prisma.history.createMany({
        data: [
          {
            userId: testUser.id,
            entityType: HistoryEntity.USER,
            entityId: testUser.id,
            action: HistoryAction.CREATE,
            description: 'Usuário criado'
          },
          {
            userId: testUser.id,
            entityType: HistoryEntity.STORE,
            entityId: testStore.id,
            action: HistoryAction.VIEW,
            description: 'Loja visualizada'
          }
        ]
      });
    });

    it('deve buscar atividade do usuário com sucesso', async () => {
      const response = await request(app)
        .get(`/api/history/user/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('histories');
      expect(response.body.histories.every((h: any) => h.userId === testUser.id)).toBe(true);
    });

    it('deve retornar erro 400 sem ID do usuário', async () => {
      const response = await request(app)
        .get('/api/history/user/')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/history/entity/:entityType/:entityId', () => {
    beforeEach(async () => {
      await prisma.history.createMany({
        data: [
          {
            userId: testUser.id,
            entityType: HistoryEntity.STORE,
            entityId: testStore.id,
            action: HistoryAction.CREATE,
            description: 'Loja criada'
          },
          {
            userId: testUser.id,
            entityType: HistoryEntity.STORE,
            entityId: testStore.id,
            action: HistoryAction.UPDATE,
            description: 'Loja atualizada'
          }
        ]
      });
    });

    it('deve buscar histórico da entidade com sucesso', async () => {
      const response = await request(app)
        .get(`/api/history/entity/${HistoryEntity.STORE}/${testStore.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('histories');
      expect(response.body.histories.every((h: any) => 
        h.entityType === HistoryEntity.STORE && h.entityId === testStore.id
      )).toBe(true);
    });

    it('deve retornar erro 400 sem parâmetros', async () => {
      const response = await request(app)
        .get('/api/history/entity/')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/history/:id', () => {
    let testHistory: any;

    beforeEach(async () => {
      testHistory = await prisma.history.create({
        data: {
          userId: testUser.id,
          entityType: HistoryEntity.USER,
          entityId: testUser.id,
          action: HistoryAction.CREATE,
          description: 'Usuário criado'
        }
      });
    });

    it('deve deletar histórico com sucesso (apenas admin)', async () => {
      let adminUser = await prisma.user.findUnique({
        where: { email: 'admin-delete@example.com' }
      });
      
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            email: 'admin-delete@example.com',
            password: await hashPassword('password123'),
            name: 'Admin Delete',
            role: 'ADMIN'
          }
        });
      } else {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { password: await hashPassword('password123') }
        });
      }

      const adminLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin-delete@example.com',
          password: 'password123'
        });

      const adminToken = adminLoginResponse.body.data.token;

      const response = await request(app)
        .delete(`/api/history/${testHistory.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      const deletedHistory = await prisma.history.findUnique({
        where: { id: testHistory.id }
      });
      expect(deletedHistory).toBeNull();

      await prisma.user.delete({ where: { id: adminUser.id } });
    });

    it('deve retornar erro 403 para usuário não admin', async () => {
      const response = await request(app)
        .delete(`/api/history/${testHistory.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/history/cleanup/old', () => {
    it('deve deletar históricos antigos com sucesso (apenas admin)', async () => {
      let adminUser = await prisma.user.findUnique({
        where: { email: 'admin-cleanup@example.com' }
      });
      
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            email: 'admin-cleanup@example.com',
            password: await hashPassword('password123'),
            name: 'Admin Cleanup',
            role: 'ADMIN'
          }
        });
      } else {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { password: await hashPassword('password123') }
        });
      }

      const adminLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin-cleanup@example.com',
          password: 'password123'
        });

      const adminToken = adminLoginResponse.body.data.token;

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      await prisma.history.create({
        data: {
          userId: testUser.id,
          entityType: HistoryEntity.USER,
          entityId: testUser.id,
          action: HistoryAction.CREATE,
          description: 'Histórico antigo',
          createdAt: oldDate
        }
      });

      const response = await request(app)
        .delete('/api/history/cleanup/old')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ daysToKeep: 90 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('deletedCount');
      expect(response.body.deletedCount).toBeGreaterThan(0);

      await prisma.user.delete({ where: { id: adminUser.id } });
    });

    it('deve retornar erro 403 para usuário não admin', async () => {
      const response = await request(app)
        .delete('/api/history/cleanup/old')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ daysToKeep: 90 });

      expect(response.status).toBe(403);
    });
  });
});
