import request from 'supertest';
import app from '../../index';
import { prisma } from '../../config/database';
import { generateToken } from '../../utils/jwt';
import { UserRole, OrderStatus } from '@prisma/client';

describe('Review Routes', () => {
  let testUserId: string;
  let storeOwnerId: string;
  let testStoreId: string;
  let testOrderId: string;
  let testAddressId: string;
  let authToken: string;
  let storeOwnerToken: string;

  beforeAll(async () => {
    let testUser = await prisma.user.findUnique({
      where: { email: 'test-review@example.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test-review@example.com',
          password: 'hashedpassword',
          name: 'Test Review User',
          phone: '11999999999',
          role: UserRole.CLIENT
        }
      });
    }
    testUserId = testUser.id;
    authToken = generateToken({ userId: testUserId, email: testUser.email, role: testUser.role });

    let storeOwner = await prisma.user.findUnique({
      where: { email: 'store-owner-review@example.com' }
    });

    if (!storeOwner) {
      storeOwner = await prisma.user.create({
        data: {
          email: 'store-owner-review@example.com',
          password: 'hashedpassword',
          name: 'Store Owner Review',
          phone: '11888888888',
          role: UserRole.STORE_OWNER
        }
      });
    }
    storeOwnerId = storeOwner.id;
    storeOwnerToken = generateToken({ userId: storeOwnerId, email: storeOwner.email, role: storeOwner.role });

    const testStore = await prisma.store.create({
      data: {
        name: 'Test Store Review',
        description: 'Store for review tests',
        phone: '11999999999',
        email: 'store-review@example.com',
        address: { street: 'Test Street', number: '123', city: 'Test City' },
        deliveryRadius: 10.0,
        estimatedDeliveryTime: 30,
        minimumOrderValue: 20.0,
        ownerId: storeOwnerId
      }
    });
    testStoreId = testStore.id;

    const testAddress = await prisma.address.create({
      data: {
        userId: testUserId,
        street: 'Test Street',
        number: '123',
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345-678',
        isDefault: true
      }
    });
    testAddressId = testAddress.id;

    const testOrder = await prisma.order.create({
      data: {
        userId: testUserId,
        storeId: testStoreId,
        addressId: testAddressId,
        status: OrderStatus.DELIVERED,
        total: 50.0,
        deliveryFee: 5.0,
        subtotal: 45.0,
        paymentMethod: 'credit_card',
        paymentStatus: 'paid'
      }
    });
    testOrderId = testOrder.id;
  });

  afterAll(async () => {
    await prisma.review.deleteMany();
    await prisma.order.deleteMany();
    await prisma.address.deleteMany();
    await prisma.store.deleteMany();
    
    const userIds = [testUserId, storeOwnerId].filter(id => id !== undefined);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } }
      });
    }
  });

  beforeEach(async () => {
    await prisma.review.deleteMany();
  });

  describe('POST /api/reviews', () => {
    it('deve criar avaliação com sucesso', async () => {
      // Criar pedido específico para este teste
      const testAddress = await prisma.address.create({
        data: {
          userId: testUserId,
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test Neighborhood',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345-678',
          isDefault: true
        }
      });

      const testOrder = await prisma.order.create({
        data: {
          userId: testUserId,
          storeId: testStoreId,
          addressId: testAddress.id,
          status: OrderStatus.DELIVERED,
          total: 50.0,
          deliveryFee: 5.0,
          subtotal: 45.0,
          paymentMethod: 'credit_card',
          paymentStatus: 'paid'
        }
      });

      const reviewData = {
        storeId: testStoreId,
        orderId: testOrder.id,
        rating: 5,
        comment: 'Excelente atendimento!'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.review.rating).toBe(5);
      expect(response.body.data.review.comment).toBe('Excelente atendimento!');
      expect(response.body.data.review.storeId).toBe(testStoreId);

      // Limpar dados específicos
      await prisma.order.delete({ where: { id: testOrder.id } });
      await prisma.address.delete({ where: { id: testAddress.id } });
    });

    it('deve falhar sem token de autenticação', async () => {
      const reviewData = {
        storeId: testStoreId,
        rating: 4,
        comment: 'Bom atendimento'
      };

      await request(app)
        .post('/api/reviews')
        .send(reviewData)
        .expect(401);
    });

    it('deve falhar com dados inválidos', async () => {
      const reviewData = {
        storeId: 'invalid-id',
        rating: 6,
        comment: 'A'.repeat(501)
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });

    it('deve falhar com loja inexistente', async () => {
      const reviewData = {
        storeId: 'clx1234567890123456789012',
        rating: 4,
        comment: 'Bom atendimento'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Loja não encontrada');
    });

    it('deve falhar ao tentar avaliar a mesma loja duas vezes', async () => {
      // Criar pedido específico para este teste
      const testAddress = await prisma.address.create({
        data: {
          userId: testUserId,
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test Neighborhood',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345-678',
          isDefault: true
        }
      });

      const testOrder = await prisma.order.create({
        data: {
          userId: testUserId,
          storeId: testStoreId,
          addressId: testAddress.id,
          status: OrderStatus.DELIVERED,
          total: 50.0,
          deliveryFee: 5.0,
          subtotal: 45.0,
          paymentMethod: 'credit_card',
          paymentStatus: 'paid'
        }
      });

      // Primeira avaliação
      const firstReviewData = {
        storeId: testStoreId,
        orderId: testOrder.id,
        rating: 5,
        comment: 'Primeira avaliação'
      };

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(firstReviewData)
        .expect(201);

      // Segunda avaliação (deve falhar)
      const secondReviewData = {
        storeId: testStoreId,
        orderId: testOrder.id,
        rating: 3,
        comment: 'Segunda avaliação'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondReviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Você já avaliou esta loja para este pedido');

      // Limpar dados específicos
      await prisma.order.delete({ where: { id: testOrder.id } });
      await prisma.address.delete({ where: { id: testAddress.id } });
    });
  });

  describe('GET /api/reviews', () => {
    it('deve obter lista de avaliações com sucesso', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeInstanceOf(Array);
      expect(response.body.data.total).toBeGreaterThanOrEqual(0);
    });

    it('deve filtrar avaliações por loja', async () => {
      const response = await request(app)
        .get(`/api/reviews?storeId=${testStoreId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeInstanceOf(Array);
    });

    it('deve filtrar avaliações por rating', async () => {
      const response = await request(app)
        .get('/api/reviews?rating=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/reviews/store/:storeId', () => {
    it('deve obter avaliações da loja com sucesso', async () => {
      const response = await request(app)
        .get(`/api/reviews/store/${testStoreId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeInstanceOf(Array);
      expect(response.body.data.total).toBeGreaterThanOrEqual(0);
    });

    it('deve falhar com loja inexistente', async () => {
      const response = await request(app)
        .get('/api/reviews/store/clx1234567890123456789012')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews/user/my-reviews', () => {
    it('deve obter avaliações do usuário com sucesso', async () => {
      const response = await request(app)
        .get('/api/reviews/user/my-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeInstanceOf(Array);
      expect(response.body.data.total).toBeGreaterThanOrEqual(0);
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .get('/api/reviews/user/my-reviews')
        .expect(401);
    });
  });

  describe('GET /api/reviews/store/:storeId/stats', () => {
    it('deve obter estatísticas da loja com sucesso', async () => {
      const response = await request(app)
        .get(`/api/reviews/store/${testStoreId}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toHaveProperty('totalReviews');
      expect(response.body.data.stats).toHaveProperty('averageRating');
      expect(response.body.data.stats).toHaveProperty('ratingDistribution');
      expect(response.body.data.stats).toHaveProperty('recentReviews');
    });
  });

  describe('GET /api/reviews/store/:storeId/can-review', () => {
    it('deve verificar se usuário pode avaliar loja', async () => {
      const response = await request(app)
        .get(`/api/reviews/store/${testStoreId}/can-review`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('canReview');
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .get(`/api/reviews/store/${testStoreId}/can-review`)
        .expect(401);
    });
  });

  describe('PUT /api/reviews/:reviewId', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await prisma.review.findFirst({
        where: { userId: testUserId, storeId: testStoreId }
      });
      reviewId = review?.id || '';
    });

    it('deve atualizar avaliação com sucesso', async () => {
      if (!reviewId) return;

      const updateData = {
        rating: 4,
        comment: 'Avaliação atualizada'
      };

      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.review.rating).toBe(4);
      expect(response.body.data.review.comment).toBe('Avaliação atualizada');
    });

    it('deve falhar sem token de autenticação', async () => {
      if (!reviewId) return;

      const updateData = {
        rating: 3,
        comment: 'Tentativa sem token'
      };

      await request(app)
        .put(`/api/reviews/${reviewId}`)
        .send(updateData)
        .expect(401);
    });

    it('deve falhar com dados inválidos', async () => {
      if (!reviewId) return;

      const updateData = {
        rating: 6,
        comment: 'A'.repeat(501)
      };

      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });
  });

  describe('DELETE /api/reviews/:reviewId', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await prisma.review.findFirst({
        where: { userId: testUserId, storeId: testStoreId }
      });
      reviewId = review?.id || '';
    });

    it('deve remover avaliação com sucesso', async () => {
      if (!reviewId) return;

      const response = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Avaliação removida com sucesso');
    });

    it('deve falhar sem token de autenticação', async () => {
      if (!reviewId) return;

      await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .expect(401);
    });

    it('deve falhar com avaliação inexistente', async () => {
      const response = await request(app)
        .delete('/api/reviews/clx1234567890123456789012')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Avaliação não encontrada');
    });
  });

  describe('GET /api/reviews/:reviewId', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await prisma.review.findFirst({
        where: { userId: testUserId, storeId: testStoreId }
      });
      reviewId = review?.id || '';
    });

    it('deve obter avaliação por ID com sucesso', async () => {
      if (!reviewId) return;

      const response = await request(app)
        .get(`/api/reviews/${reviewId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.review.id).toBe(reviewId);
    });

    it('deve falhar com ID inexistente', async () => {
      const response = await request(app)
        .get('/api/reviews/clx1234567890123456789012')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Avaliação não encontrada');
    });
  });
});
