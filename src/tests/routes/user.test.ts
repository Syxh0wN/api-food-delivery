import request from 'supertest';
import express from 'express';
import cors from 'cors';
import userRoutes from '../../routes/user';
import { prisma } from '../setup';
import { generateToken } from '../../utils/jwt';
import { UserRole } from '@prisma/client';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  let authToken: string;
  let userId: string;
  let testEmail: string;

  const createTestUser = async () => {
    testEmail = `test${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: 'hashedpassword',
        name: 'Test User',
        phone: '123456789',
        role: UserRole.CLIENT
      }
    });

    userId = user.id;
    authToken = generateToken({ userId: user.id, email: user.email, role: user.role });
    return user;
  };

  beforeEach(async () => {
    // Limpar dados antes de cada teste em ordem correta
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.review.deleteMany();
    await prisma.product.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.store.deleteMany();
    await prisma.category.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile', async () => {
      await createTestUser();

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testEmail);
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      await createTestUser();

      const updateData = {
        name: 'Updated Name',
        phone: '11987654321'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.phone).toBe('11987654321');
    });

    it('should return validation error for invalid data', async () => {
      await createTestUser();

      const invalidData = {
        name: 'A',
        phone: '123'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/users/addresses', () => {
    it('should get user addresses', async () => {
      await createTestUser();

      await prisma.address.create({
        data: {
          userId,
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567'
        }
      });

      const response = await request(app)
        .get('/api/users/addresses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.addresses).toHaveLength(1);
    });
  });

  describe('POST /api/users/addresses', () => {
    it('should create new address', async () => {
      await createTestUser();

      const addressData = {
        street: 'Rua Nova',
        number: '456',
        neighborhood: 'Vila Nova',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234568',
        isDefault: true
      };

      const response = await request(app)
        .post('/api/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.address.street).toBe('Rua Nova');
    });

    it('should return validation error for invalid data', async () => {
      await createTestUser();

      const invalidData = {
        street: 'A',
        number: '',
        neighborhood: 'B',
        city: 'C',
        state: 'D',
        zipCode: '123'
      };

      const response = await request(app)
        .post('/api/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/users/addresses/:addressId', () => {
    it('should update address', async () => {
      await createTestUser();

      const address = await prisma.address.create({
        data: {
          userId,
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567'
        }
      });

      const updateData = {
        street: 'Rua Atualizada',
        number: '456'
      };

      const response = await request(app)
        .put(`/api/users/addresses/${address.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.address.street).toBe('Rua Atualizada');
    });
  });

  describe('DELETE /api/users/addresses/:addressId', () => {
    it('should delete address', async () => {
      await createTestUser();

      const address = await prisma.address.create({
        data: {
          userId,
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567'
        }
      });

      const response = await request(app)
        .delete(`/api/users/addresses/${address.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/users/addresses/:addressId/default', () => {
    it('should set default address', async () => {
      await createTestUser();

      const address = await prisma.address.create({
        data: {
          userId,
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567'
        }
      });

      const response = await request(app)
        .patch(`/api/users/addresses/${address.id}/default`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.address.isDefault).toBe(true);
    });
  afterAll(async () => {
    await prisma.$disconnect();
  });
