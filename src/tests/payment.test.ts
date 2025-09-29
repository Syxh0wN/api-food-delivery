import request from 'supertest';
import app from '../index';
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';
import { UserRole } from '@prisma/client';

describe('Payment System', () => {
  let userToken: string;
  let adminToken: string;
  let storeOwnerToken: string;
  let userId: string;
  let storeId: string;
  let orderId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'testuser@payment.com',
        password: 'hashedpassword',
        name: 'Test User',
        phone: '11999999999',
        role: UserRole.USER
      }
    });
    userId = user.id;
    userToken = generateToken(user);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@payment.com',
        password: 'hashedpassword',
        name: 'Admin User',
        phone: '11999999998',
        role: UserRole.ADMIN
      }
    });
    adminToken = generateToken(admin);

    const storeOwner = await prisma.user.create({
      data: {
        email: 'storeowner@payment.com',
        password: 'hashedpassword',
        name: 'Store Owner',
        phone: '11999999997',
        role: UserRole.STORE_OWNER
      }
    });
    storeOwnerToken = generateToken(storeOwner);

    const store = await prisma.store.create({
      data: {
        name: 'Test Store',
        description: 'Test Store Description',
        address: 'Test Address',
        phone: '11999999996',
        ownerId: storeOwner.id,
        isActive: true
      }
    });
    storeId = store.id;

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        storeId: store.id,
        totalAmount: 25.50,
        status: 'PENDING',
        paymentStatus: 'pending',
        paymentMethod: 'CREDIT_CARD'
      }
    });
    orderId = order.id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/payments/payment-intent', () => {
    it('deve criar um payment intent com sucesso', async () => {
      const response = await request(app)
        .post('/api/payments/payment-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: orderId,
          amount: 25.50,
          currency: 'brl',
          paymentMethod: 'CREDIT_CARD'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentIntent).toHaveProperty('id');
      expect(response.body.data.paymentIntent).toHaveProperty('clientSecret');
    });

    it('deve retornar erro se usuário não estiver autenticado', async () => {
      const response = await request(app)
        .post('/api/payments/payment-intent')
        .send({
          orderId: orderId,
          amount: 25.50,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar erro de validação se dados inválidos', async () => {
      const response = await request(app)
        .post('/api/payments/payment-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: 'invalid-id',
          amount: -10,
          paymentMethod: 'INVALID_METHOD'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/confirm/:paymentIntentId', () => {
    it('deve retornar erro se usuário não estiver autenticado', async () => {
      const response = await request(app)
        .post('/api/payments/confirm/test-payment-intent-id');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar erro se paymentIntentId inválido', async () => {
      const response = await request(app)
        .post('/api/payments/confirm/')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/payments/refund', () => {
    it('deve retornar erro se usuário não for admin ou store owner', async () => {
      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentIntentId: 'test-payment-intent-id',
          amount: 10.00
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('deve permitir admin criar reembolso', async () => {
      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentIntentId: 'test-payment-intent-id',
          amount: 10.00,
          reason: 'requested_by_customer'
        });

      expect(response.status).toBe(400);
    });

    it('deve permitir store owner criar reembolso', async () => {
      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send({
          paymentIntentId: 'test-payment-intent-id',
          amount: 10.00,
          reason: 'requested_by_customer'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/payments/status/:paymentIntentId', () => {
    it('deve retornar erro se usuário não estiver autenticado', async () => {
      const response = await request(app)
        .get('/api/payments/status/test-payment-intent-id');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar erro se paymentIntentId inválido', async () => {
      const response = await request(app)
        .get('/api/payments/status/')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('deve retornar erro se webhook secret não configurado', async () => {
      const response = await request(app)
        .post('/api/payments/webhook')
        .send({
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'test-payment-intent-id',
              status: 'succeeded',
              metadata: {
                orderId: orderId
              }
            }
          }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
