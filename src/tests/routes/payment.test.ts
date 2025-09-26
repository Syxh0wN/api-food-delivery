import request from 'supertest';
import app from '../../index';
import { prisma } from '../../config/database';
import { generateToken } from '../../utils/jwt';
import { UserRole } from '@prisma/client';

describe('Payment Routes', () => {
  let authToken: string;
  let testUserId: string;
  let testOrderId: string;
  let testStoreId: string;

  beforeAll(async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test-payment@example.com',
        password: 'hashedpassword',
        name: 'Test Payment User',
        phone: '11999999999',
        role: UserRole.CLIENT
      }
    });

    testUserId = testUser.id;
    authToken = generateToken({
      userId: testUserId,
      email: testUser.email,
      role: testUser.role
    });

    const testStore = await prisma.store.create({
      data: {
        name: 'Test Payment Store',
        description: 'Store for payment tests',
        phone: '11999999999',
        email: 'store@example.com',
        address: {
          street: 'Test Street',
          number: '123',
          city: 'Test City',
          state: 'SP',
          zipCode: '12345-678'
        },
        deliveryRadius: 5.0,
        estimatedDeliveryTime: 30,
        minimumOrderValue: 20.0,
        ownerId: testUserId
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
        state: 'SP',
        zipCode: '12345-678',
        isDefault: true
      }
    });

    const testOrder = await prisma.order.create({
      data: {
        userId: testUserId,
        storeId: testStoreId,
        addressId: testAddress.id,
        status: 'PENDING',
        total: 25.0,
        deliveryFee: 5.0,
        subtotal: 20.0,
        paymentMethod: 'CREDIT_CARD',
        paymentStatus: 'pending'
      }
    });

    testOrderId = testOrder.id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.address.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.store.deleteMany({
      where: { ownerId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { id: testUserId }
    });
  });

  describe('POST /api/payment-intent', () => {
    it('deve criar payment intent com sucesso', async () => {
      const paymentData = {
        orderId: testOrderId,
        amount: 25.0,
        currency: 'brl',
        paymentMethod: 'CREDIT_CARD'
      };

      const response = await request(app)
        .post('/api/payment-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentIntent).toBeDefined();
      expect(response.body.data.paymentIntent.orderId).toBe(testOrderId);
      expect(response.body.data.paymentIntent.amount).toBe(25.0);
    });

    it('deve falhar sem token de autenticação', async () => {
      const paymentData = {
        orderId: testOrderId,
        amount: 25.0,
        paymentMethod: 'CREDIT_CARD'
      };

      await request(app)
        .post('/api/payment-intent')
        .send(paymentData)
        .expect(401);
    });

    it('deve falhar com dados inválidos', async () => {
      const paymentData = {
        orderId: 'invalid-id',
        amount: -10,
        paymentMethod: 'INVALID_METHOD'
      };

      const response = await request(app)
        .post('/api/payment-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });

    it('deve falhar com pedido inexistente', async () => {
      const paymentData = {
        orderId: 'non-existent-order-id',
        amount: 25.0,
        paymentMethod: 'CREDIT_CARD'
      };

      const response = await request(app)
        .post('/api/payment-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Pedido não encontrado');
    });
  });

  describe('POST /api/confirm/:paymentIntentId', () => {
    it('deve confirmar pagamento com sucesso', async () => {
      const paymentIntentId = 'pi_test_payment_intent_id';

      const response = await request(app)
        .post(`/api/confirm/${paymentIntentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Pagamento confirmado com sucesso');
    });

    it('deve falhar sem token de autenticação', async () => {
      const paymentIntentId = 'pi_test_payment_intent_id';

      await request(app)
        .post(`/api/confirm/${paymentIntentId}`)
        .expect(401);
    });

    it('deve falhar sem payment intent ID', async () => {
      const response = await request(app)
        .post('/api/confirm/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/status/:paymentIntentId', () => {
    it('deve obter status do pagamento', async () => {
      const paymentIntentId = 'pi_test_payment_intent_id';

      const response = await request(app)
        .get(`/api/status/${paymentIntentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
    });

    it('deve falhar sem token de autenticação', async () => {
      const paymentIntentId = 'pi_test_payment_intent_id';

      await request(app)
        .get(`/api/status/${paymentIntentId}`)
        .expect(401);
    });
  });

  describe('POST /api/refund', () => {
    let adminToken: string;
    let adminUserId: string;

    beforeAll(async () => {
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin-payment@example.com',
          password: 'hashedpassword',
          name: 'Admin Payment User',
          phone: '11999999999',
          role: UserRole.ADMIN
        }
      });

      adminUserId = adminUser.id;
      adminToken = generateToken({
        userId: adminUserId,
        email: adminUser.email,
        role: adminUser.role
      });
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { id: adminUserId }
      });
    });

    it('deve criar reembolso com sucesso (admin)', async () => {
      const refundData = {
        paymentIntentId: 'pi_test_payment_intent_id',
        amount: 25.0,
        reason: 'requested_by_customer'
      };

      const response = await request(app)
        .post('/api/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.refund).toBeDefined();
    });

    it('deve falhar para usuário comum', async () => {
      const refundData = {
        paymentIntentId: 'pi_test_payment_intent_id',
        amount: 25.0,
        reason: 'requested_by_customer'
      };

      const response = await request(app)
        .post('/api/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send(refundData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });

    it('deve falhar sem token de autenticação', async () => {
      const refundData = {
        paymentIntentId: 'pi_test_payment_intent_id',
        amount: 25.0,
        reason: 'requested_by_customer'
      };

      await request(app)
        .post('/api/refund')
        .send(refundData)
        .expect(401);
    });
  });

  describe('POST /api/webhook', () => {
    it('deve processar webhook com sucesso', async () => {
      const webhookData = {
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_payment_intent_id',
            status: 'succeeded',
            metadata: {
              orderId: testOrderId
            },
            amount: 2500,
            currency: 'brl'
          }
        }
      };

      const response = await request(app)
        .post('/api/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Webhook processado com sucesso');
    });

    it('deve falhar com webhook secret não configurado', async () => {
      const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const webhookData = {
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_payment_intent_id',
            status: 'succeeded',
            metadata: {
              orderId: testOrderId
            },
            amount: 2500,
            currency: 'brl'
          }
        }
      };

      const response = await request(app)
        .post('/api/webhook')
        .send(webhookData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Webhook secret não configurado');

      if (originalSecret) {
        process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
      }
    });
  });
});
