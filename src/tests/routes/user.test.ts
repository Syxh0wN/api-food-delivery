import request from 'supertest';
import express from 'express';
import cors from 'cors';
import userRoutes from '../../routes/user';
import { prisma } from '../setup';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        phone: '123456789'
      }
    });

    userId = user.id;
    authToken = 'valid-token-for-testing';
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
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
      const updateData = {
        name: 'Updated Name',
        phone: '987654321'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('Updated Name');
    });

    it('should return validation error for invalid data', async () => {
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
  });
});
