import request from 'supertest';
import app from '../../index';
import { prisma } from '../../config/database';
import { UserRole, CouponType } from '@prisma/client';
import { generateToken } from '../../utils/jwt';

describe('Coupon Routes', () => {
  let clientToken: string;
  let storeOwnerToken: string;
  let testUser: any;
  let testStoreOwner: any;
  let testStore: any;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    testUser = await prisma.user.create({
      data: {
        email: `cliente-coupon-${timestamp}@test.com`,
        password: 'hashedpassword',
        name: 'Cliente Teste',
        role: UserRole.CLIENT
      }
    });

    testStoreOwner = await prisma.user.create({
      data: {
        email: `dono-coupon-${timestamp}@test.com`,
        password: 'hashedpassword',
        name: 'Dono Teste',
        role: UserRole.STORE_OWNER
      }
    });

    clientToken = generateToken({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role
    });

    storeOwnerToken = generateToken({
      userId: testStoreOwner.id,
      email: testStoreOwner.email,
      role: testStoreOwner.role
    });
  });

  beforeEach(async () => {
    await prisma.couponUsage.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.store.deleteMany();

    testStore = await prisma.store.create({
      data: {
        name: 'Loja Teste',
        description: 'Loja para testes',
        phone: '11999999999',
        email: testStoreOwner.email,
        address: JSON.stringify({
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567'
        }),
        deliveryRadius: 5,
        estimatedDeliveryTime: 30,
        minimumOrderValue: 25,
        isOpen: true,
        ownerId: testStoreOwner.id
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/coupons/active', () => {
    beforeEach(async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await prisma.coupon.createMany({
        data: [
          {
            code: 'ATIVO',
            type: CouponType.PERCENTAGE,
            value: 10,
            validFrom: past,
            validUntil: future,
            isActive: true
          },
          {
            code: 'INATIVO',
            type: CouponType.PERCENTAGE,
            value: 10,
            validFrom: past,
            validUntil: future,
            isActive: false
          }
        ]
      });
    });

    it('deve listar cupons ativos', async () => {
      const response = await request(app)
        .get('/api/coupons/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cupons ativos obtidos com sucesso');
      expect(response.body.data.coupons).toHaveLength(1);
      expect(response.body.data.coupons[0].code).toBe('ATIVO');
    });
  });

  describe('GET /api/coupons/code/:code', () => {
    beforeEach(async () => {
      await prisma.coupon.create({
        data: {
          code: 'CODIGOTESTE',
          type: CouponType.PERCENTAGE,
          value: 10,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31')
        }
      });
    });

    it('deve buscar cupom por código', async () => {
      const response = await request(app)
        .get('/api/coupons/code/CODIGOTESTE')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.code).toBe('CODIGOTESTE');
    });

    it('deve retornar 404 para código inexistente', async () => {
      const response = await request(app)
        .get('/api/coupons/code/INEXISTENTE')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cupom não encontrado');
    });
  });

  describe('POST /api/coupons/validate', () => {
    beforeEach(async () => {
      await prisma.coupon.create({
        data: {
          code: 'VALIDAR',
          type: CouponType.PERCENTAGE,
          value: 10,
          minOrderValue: 50,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          isActive: true
        }
      });
    });

    it('deve validar cupom com sucesso', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await prisma.coupon.create({
        data: {
          code: 'VALIDAR2',
          type: CouponType.PERCENTAGE,
          value: 10,
          minOrderValue: 50,
          validFrom: past,
          validUntil: future,
          isActive: true
        }
      });

      const validationData = {
        code: 'VALIDAR2',
        orderValue: 100
      };

      const response = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(validationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.discount).toBe(10);
    });

    it('deve falhar sem token de autenticação', async () => {
      const validationData = {
        code: 'VALIDAR',
        orderValue: 100
      };

      const response = await request(app)
        .post('/api/coupons/validate')
        .send(validationData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('deve falhar com dados inválidos', async () => {
      const validationData = {
        code: '',
        orderValue: -10
      };

      const response = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(validationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });
  });

  describe('POST /api/coupons', () => {
    it('deve criar cupom com sucesso', async () => {
      const couponData = {
        code: 'NOVOCUPOM',
        type: 'PERCENTAGE',
        value: 15,
        minOrderValue: 30,
        maxUses: 50,
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-12-31T23:59:59.999Z'
      };

      const response = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send(couponData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cupom criado com sucesso');
      expect(response.body.data.coupon.code).toBe('NOVOCUPOM');
      expect(response.body.data.coupon.value).toBe(15);
    });

    it('deve falhar sem token de autenticação', async () => {
      const couponData = {
        code: 'NOVOCUPOM',
        type: 'PERCENTAGE',
        value: 15,
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-12-31T23:59:59.999Z'
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(couponData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('deve falhar para usuário cliente', async () => {
      const couponData = {
        code: 'NOVOCUPOM',
        type: 'PERCENTAGE',
        value: 15,
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-12-31T23:59:59.999Z'
      };

      const response = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(couponData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Acesso negado');
    });

    it('deve falhar com dados inválidos', async () => {
      const couponData = {
        code: 'AB',
        type: 'INVALID_TYPE',
        value: -5
      };

      const response = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send(couponData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });
  });

  describe('GET /api/coupons', () => {
    beforeEach(async () => {
      await prisma.coupon.createMany({
        data: [
          {
            code: 'CUPOM1',
            type: CouponType.PERCENTAGE,
            value: 10,
            validFrom: new Date('2024-01-01'),
            validUntil: new Date('2024-12-31')
          },
          {
            code: 'CUPOM2',
            type: CouponType.FIXED,
            value: 5,
            validFrom: new Date('2024-01-01'),
            validUntil: new Date('2024-12-31')
          }
        ]
      });
    });

    it('deve listar todos os cupons', async () => {
      const response = await request(app)
        .get('/api/coupons')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupons).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('deve falhar para usuário cliente', async () => {
      const response = await request(app)
        .get('/api/coupons')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/coupons/:id', () => {
    let testCoupon: any;

    beforeEach(async () => {
      testCoupon = await prisma.coupon.create({
        data: {
          code: 'BUSCARID',
          type: CouponType.PERCENTAGE,
          value: 10,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31')
        }
      });
    });

    it('deve retornar cupom específico', async () => {
      const response = await request(app)
        .get(`/api/coupons/${testCoupon.id}`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.id).toBe(testCoupon.id);
      expect(response.body.data.coupon.code).toBe('BUSCARID');
    });

    it('deve retornar 404 para cupom inexistente', async () => {
      const response = await request(app)
        .get('/api/coupons/cupom-inexistente')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/coupons/:id', () => {
    let testCoupon: any;

    beforeEach(async () => {
      testCoupon = await prisma.coupon.create({
        data: {
          code: 'ATUALIZAR',
          type: CouponType.PERCENTAGE,
          value: 10,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31')
        }
      });
    });

    it('deve atualizar cupom com sucesso', async () => {
      const updateData = {
        code: 'ATUALIZADO',
        value: 20,
        isActive: false
      };

      const response = await request(app)
        .put(`/api/coupons/${testCoupon.id}`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.code).toBe('ATUALIZADO');
      expect(response.body.data.coupon.value).toBe(20);
      expect(response.body.data.coupon.isActive).toBe(false);
    });

    it('deve falhar para usuário cliente', async () => {
      const updateData = {
        value: 20
      };

      const response = await request(app)
        .put(`/api/coupons/${testCoupon.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('deve retornar 400 para cupom inexistente', async () => {
      const updateData = {
        value: 20
      };

      const response = await request(app)
        .put('/api/coupons/cupom-inexistente')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/coupons/:id', () => {
    let testCoupon: any;

    beforeEach(async () => {
      testCoupon = await prisma.coupon.create({
        data: {
          code: 'EXCLUIR',
          type: CouponType.PERCENTAGE,
          value: 10,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31')
        }
      });
    });

    it('deve excluir cupom com sucesso', async () => {
      const response = await request(app)
        .delete(`/api/coupons/${testCoupon.id}`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cupom excluído com sucesso');
    });

    it('deve falhar para usuário cliente', async () => {
      const response = await request(app)
        .delete(`/api/coupons/${testCoupon.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('deve retornar 400 para cupom inexistente', async () => {
      const response = await request(app)
        .delete('/api/coupons/cupom-inexistente')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/coupons/:id/usage', () => {
    let testCoupon: any;

    beforeEach(async () => {
      testCoupon = await prisma.coupon.create({
        data: {
          code: 'HISTORICO',
          type: CouponType.PERCENTAGE,
          value: 10,
          usedCount: 1,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31')
        }
      });
    });

    it('deve retornar histórico de uso do cupom', async () => {
      const response = await request(app)
        .get(`/api/coupons/${testCoupon.id}/usage`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Histórico de uso do cupom obtido com sucesso');
      expect(response.body.data).toHaveProperty('usages');
      expect(response.body.data).toHaveProperty('total');
    });

    it('deve falhar para usuário cliente', async () => {
      const response = await request(app)
        .get(`/api/coupons/${testCoupon.id}/usage`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/stores/:storeId/coupons', () => {
    it('deve criar cupom para loja específica', async () => {
      const couponData = {
        code: 'CUPOMDALOJA',
        type: 'PERCENTAGE',
        value: 15,
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-12-31T23:59:59.999Z'
      };

      const response = await request(app)
        .post(`/api/stores/${testStore.id}/coupons`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send(couponData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cupom da loja criado com sucesso');
      expect(response.body.data.coupon.code).toBe('CUPOMDALOJA');
      expect(response.body.data.coupon.storeId).toBe(testStore.id);
    });

    it('deve falhar para usuário que não é dono da loja', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: `outro-${Date.now()}@test.com`,
          password: 'hashedpassword',
          name: 'Outro Usuário',
          role: UserRole.STORE_OWNER
        }
      });

      const otherToken = generateToken({
        userId: otherUser.id,
        email: otherUser.email,
        role: otherUser.role
      });

      const couponData = {
        code: 'CUPOMDALOJA',
        type: 'PERCENTAGE',
        value: 15,
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-12-31T23:59:59.999Z'
      };

      const response = await request(app)
        .post(`/api/stores/${testStore.id}/coupons`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(couponData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/stores/:storeId/coupons', () => {
    beforeEach(async () => {
      await prisma.coupon.createMany({
        data: [
          {
            code: 'GLOBAL',
            type: CouponType.PERCENTAGE,
            value: 10,
            validFrom: new Date('2024-01-01'),
            validUntil: new Date('2024-12-31')
          },
          {
            code: 'LOJA1',
            type: CouponType.FIXED,
            value: 5,
            validFrom: new Date('2024-01-01'),
            validUntil: new Date('2024-12-31'),
            storeId: testStore.id
          }
        ]
      });
    });

    it('deve listar cupons da loja para o dono', async () => {
      const response = await request(app)
        .get(`/api/stores/${testStore.id}/coupons`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupons).toHaveLength(1);
      expect(response.body.data.coupons[0].code).toBe('LOJA1');
    });

    it('deve falhar para usuário que não é dono da loja', async () => {
      const response = await request(app)
        .get(`/api/stores/${testStore.id}/coupons`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
