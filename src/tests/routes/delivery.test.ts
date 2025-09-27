import request from 'supertest';
import app from '../../index';
import { prisma } from '../../config/database';
import { DeliveryStatus, DeliveryMethod, OrderStatus } from '@prisma/client';
import { hashPassword } from '../../utils/hash';

describe('Melhorias no Sistema de Pedidos', () => {
  let testUser: any;
  let testStore: any;
  let testProduct: any;
  let testOrder: any;
  let testDeliveryPerson: any;
  let authToken: string;
  let storeOwnerToken: string;
  let adminToken: string;

  // Helper function para criar dados de teste
  const createTestOrder = async () => {
    const testAddress = await prisma.address.create({
      data: {
        userId: testUser.id,
        street: 'Test Street',
        number: '123',
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345-678',
        isDefault: true
      }
    });

    const testOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        storeId: testStore.id,
        addressId: testAddress.id,
        status: OrderStatus.CONFIRMED,
        total: 20.00,
        subtotal: 15.00,
        deliveryFee: 5.00,
        paymentMethod: 'Credit Card',
        paymentStatus: 'paid',
        items: {
          create: [{
            productId: testProduct.id,
            quantity: 1,
            price: 15.00
          }]
        }
      }
    });

    return { testOrder, testAddress };
  };

  beforeAll(async () => {
    let existingUser = await prisma.user.findUnique({
      where: { email: 'test-delivery@example.com' }
    });

    if (!existingUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test-delivery@example.com',
          password: await hashPassword('password123'),
          name: 'Test User Delivery',
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
      where: { email: 'store-owner-delivery@example.com' }
    });

    if (!existingStoreOwner) {
      const storeOwner = await prisma.user.create({
        data: {
          email: 'store-owner-delivery@example.com',
          password: await hashPassword('password123'),
          name: 'Store Owner Delivery',
          role: 'STORE_OWNER'
        }
      });

      testStore = await prisma.store.create({
        data: {
          name: 'Test Store Delivery',
          description: 'Test store for delivery',
          phone: '123456789',
          email: 'store-delivery@example.com',
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
      where: { name: 'Test Category Delivery' }
    });

    if (!existingCategory) {
      const category = await prisma.category.create({
        data: {
          name: 'Test Category Delivery',
          description: 'Test category for delivery'
        }
      });

      testProduct = await prisma.product.create({
        data: {
          name: 'Test Product Delivery',
          description: 'Test product for delivery',
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
        zipCode: '12345-678',
        isDefault: true
      }
    });

    testOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        storeId: testStore.id,
        addressId: testAddress.id,
        status: OrderStatus.CONFIRMED,
        total: 20.00,
        subtotal: 15.00,
        deliveryFee: 5.00,
        paymentMethod: 'Credit Card',
        paymentStatus: 'paid',
        items: {
          create: [{
            productId: testProduct.id,
            quantity: 1,
            price: 15.00
          }]
        }
      }
    });

    testDeliveryPerson = await prisma.deliveryPerson.create({
      data: {
        name: 'Test Delivery Person',
        phone: '987654321',
        email: 'delivery@example.com',
        password: await hashPassword('password123'),
        isActive: true,
        isAvailable: true
      }
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test-delivery@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;

    const storeOwnerLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'store-owner-delivery@example.com',
        password: 'password123'
      });

    storeOwnerToken = storeOwnerLoginResponse.body.data.token;

    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin-delivery@example.com' }
    });

    if (!adminUser) {
      await prisma.user.create({
        data: {
          email: 'admin-delivery@example.com',
          password: await hashPassword('password123'),
          name: 'Admin Delivery',
          role: 'ADMIN'
        }
      });
    }

    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin-delivery@example.com',
        password: 'password123'
      });

    adminToken = adminLoginResponse.body.data.token;
  });

  afterAll(async () => {
    await prisma.deliveryTracking.deleteMany({
      where: { orderId: testOrder?.id }
    });

    if (testDeliveryPerson) {
      try {
        await prisma.deliveryPerson.delete({ where: { id: testDeliveryPerson.id } });
      } catch (error) {}
    }

    if (testOrder) {
      try {
        await prisma.order.delete({ where: { id: testOrder.id } });
      } catch (error) {}
    }

    if (testProduct) {
      try {
        await prisma.product.delete({ where: { id: testProduct.id } });
      } catch (error) {}
    }

    if (testStore) {
      try {
        await prisma.store.delete({ where: { id: testStore.id } });
      } catch (error) {}
    }

    if (testUser) {
      try {
        await prisma.user.delete({ where: { id: testUser.id } });
      } catch (error) {}
    }

    const storeOwner = await prisma.user.findUnique({
      where: { email: 'store-owner-delivery@example.com' }
    });
    if (storeOwner) {
      try {
        await prisma.user.delete({ where: { id: storeOwner.id } });
      } catch (error) {}
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin-delivery@example.com' }
    });
    if (adminUser) {
      try {
        await prisma.user.delete({ where: { id: adminUser.id } });
      } catch (error) {}
    }

    const category = await prisma.category.findUnique({
      where: { name: 'Test Category Delivery' }
    });
    if (category) {
      try {
        await prisma.category.delete({ where: { id: category.id } });
      } catch (error) {}
    }
  });

  beforeEach(async () => {
    if (testOrder?.id) {
      await prisma.deliveryTracking.deleteMany({
        where: { orderId: testOrder.id }
      });
    }
  });

  describe('POST /api/delivery/tracking', () => {
    it('deve criar rastreamento de entrega com sucesso', async () => {
      if (!testUser?.id || !testStore?.id || !testProduct?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      const { testOrder, testAddress } = await createTestOrder();

      const response = await request(app)
        .post('/api/delivery/tracking')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrder.id,
          method: DeliveryMethod.DELIVERY,
          estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString(),
          deliveryPersonId: testDeliveryPerson.id,
          notes: 'Test tracking'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.orderId).toBe(testOrder.id);
      expect(response.body.method).toBe(DeliveryMethod.DELIVERY);
      expect(response.body.trackingCode).toBeDefined();

      // Limpar dados do teste
      await prisma.deliveryTracking.deleteMany({
        where: { orderId: testOrder.id }
      });
      await prisma.order.delete({ where: { id: testOrder.id } });
      await prisma.address.delete({ where: { id: testAddress.id } });
    });

    it('deve falhar com dados inválidos', async () => {
      const response = await request(app)
        .post('/api/delivery/tracking')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: 'invalid-id',
          method: 'INVALID_METHOD'
        });

      expect(response.status).toBe(400);
    });

    it('deve falhar sem autenticação', async () => {
      const response = await request(app)
        .post('/api/delivery/tracking')
        .send({
          orderId: testOrder.id,
          method: DeliveryMethod.DELIVERY
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/delivery/tracking/:trackingId/status', () => {
    let trackingId: string;

    beforeEach(async () => {
      if (!testUser?.id || !testStore?.id || !testProduct?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }
      
      // Criar endereço e pedido específicos para este teste
      const testAddress = await prisma.address.create({
        data: {
          userId: testUser.id,
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test Neighborhood',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345-678',
          isDefault: true
        }
      });

      const testOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          storeId: testStore.id,
          addressId: testAddress.id,
          status: OrderStatus.CONFIRMED,
          total: 20.00,
          subtotal: 15.00,
          deliveryFee: 5.00,
          paymentMethod: 'Credit Card',
          paymentStatus: 'paid',
          items: {
            create: [{
              productId: testProduct.id,
              quantity: 1,
              price: 15.00
            }]
          }
        }
      });
      
      const tracking = await prisma.deliveryTracking.create({
        data: {
          orderId: testOrder.id,
          status: DeliveryStatus.PENDING,
          method: DeliveryMethod.DELIVERY,
          trackingCode: 'TEST123',
          locations: []
        }
      });
      trackingId = tracking.id;
    });

    it('deve atualizar status de entrega com sucesso', async () => {
      const response = await request(app)
        .put(`/api/delivery/tracking/${trackingId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: DeliveryStatus.CONFIRMED,
          notes: 'Pedido confirmado'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(DeliveryStatus.CONFIRMED);
    });

    it('deve atualizar status com localização', async () => {
      const response = await request(app)
        .put(`/api/delivery/tracking/${trackingId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: DeliveryStatus.OUT_FOR_DELIVERY,
          location: {
            latitude: -23.5505,
            longitude: -46.6333,
            address: 'São Paulo, SP',
            timestamp: new Date().toISOString()
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(DeliveryStatus.OUT_FOR_DELIVERY);
    });

    it('deve falhar com tracking inexistente', async () => {
      const response = await request(app)
        .put('/api/delivery/tracking/invalid-id/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: DeliveryStatus.CONFIRMED
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/delivery/tracking/order/:orderId', () => {
    let testOrder: any;
    let testAddress: any;

    beforeEach(async () => {
      if (!testUser?.id || !testStore?.id || !testProduct?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }
      
      const orderData = await createTestOrder();
      testOrder = orderData.testOrder;
      testAddress = orderData.testAddress;
      
      await prisma.deliveryTracking.create({
        data: {
          orderId: testOrder.id,
          status: DeliveryStatus.CONFIRMED,
          method: DeliveryMethod.DELIVERY,
          trackingCode: 'TEST123',
          locations: []
        }
      });
    });

    afterEach(async () => {
      if (testOrder?.id) {
        await prisma.deliveryTracking.deleteMany({
          where: { orderId: testOrder.id }
        });
        await prisma.order.delete({ where: { id: testOrder.id } });
        await prisma.address.delete({ where: { id: testAddress.id } });
      }
    });

    it('deve buscar rastreamento do pedido com sucesso', async () => {
      const response = await request(app)
        .get(`/api/delivery/tracking/order/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('order');
      expect(response.body).toHaveProperty('tracking');
      expect(response.body).toHaveProperty('store');
      expect(response.body).toHaveProperty('customer');
      expect(response.body).toHaveProperty('timeline');
    });

    it('deve retornar erro para pedido sem rastreamento', async () => {
      if (!testUser?.id || !testStore?.id || !testProduct?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      // Criar um pedido sem rastreamento
      const testAddress = await prisma.address.create({
        data: {
          userId: testUser.id,
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test Neighborhood',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345-678',
          isDefault: true
        }
      });

      const newOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          storeId: testStore.id,
          addressId: testAddress.id,
          status: OrderStatus.PENDING,
          total: 10.00,
          subtotal: 10.00,
          deliveryFee: 0,
          paymentMethod: 'Credit Card',
          paymentStatus: 'pending'
        }
      });

      const response = await request(app)
        .get(`/api/delivery/tracking/order/${newOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);

      // Limpar dados do teste
      await prisma.order.delete({ where: { id: newOrder.id } });
      await prisma.address.delete({ where: { id: testAddress.id } });
    });
  });

  describe('GET /api/delivery/tracking/code/:trackingCode', () => {
    let testOrder: any;
    let testAddress: any;

    beforeEach(async () => {
      if (!testUser?.id || !testStore?.id || !testProduct?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }
      
      const orderData = await createTestOrder();
      testOrder = orderData.testOrder;
      testAddress = orderData.testAddress;
      
      await prisma.deliveryTracking.create({
        data: {
          orderId: testOrder.id,
          status: DeliveryStatus.CONFIRMED,
          method: DeliveryMethod.DELIVERY,
          trackingCode: 'PUBLIC123',
          locations: []
        }
      });
    });

    afterEach(async () => {
      if (testOrder?.id) {
        await prisma.deliveryTracking.deleteMany({
          where: { orderId: testOrder.id }
        });
        await prisma.order.delete({ where: { id: testOrder.id } });
        await prisma.address.delete({ where: { id: testAddress.id } });
      }
    });

    it('deve buscar rastreamento por código com sucesso', async () => {
      const response = await request(app)
        .get('/api/delivery/tracking/code/PUBLIC123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('order');
      expect(response.body).toHaveProperty('tracking');
    });

    it('deve retornar erro para código inexistente', async () => {
      const response = await request(app)
        .get('/api/delivery/tracking/code/INVALID123');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/delivery/estimate/:orderId', () => {
    it('deve calcular estimativa de entrega com sucesso', async () => {
      if (!testUser?.id || !testStore?.id || !testProduct?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      const { testOrder, testAddress } = await createTestOrder();

      const response = await request(app)
        .get(`/api/delivery/estimate/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orderId');
      expect(response.body).toHaveProperty('estimatedTotalTime');
      expect(response.body).toHaveProperty('estimatedDeliveryDate');
      expect(response.body).toHaveProperty('factors');

      // Limpar dados do teste
      await prisma.order.delete({ where: { id: testOrder.id } });
      await prisma.address.delete({ where: { id: testAddress.id } });
    });

    it('deve retornar erro para pedido inexistente', async () => {
      const response = await request(app)
        .get('/api/delivery/estimate/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/delivery/persons', () => {
    it('deve criar entregador com sucesso (apenas admin)', async () => {
      const response = await request(app)
        .post('/api/delivery/persons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Delivery Person',
          phone: '111111111',
          email: 'newdelivery@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('New Delivery Person');

      await prisma.deliveryPerson.delete({ where: { id: response.body.id } });
    });

    it('deve retornar erro 403 para usuário não admin', async () => {
      const response = await request(app)
        .post('/api/delivery/persons')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Delivery Person',
          phone: '111111111',
          email: 'newdelivery2@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/delivery/persons/:deliveryPersonId', () => {
    it('deve atualizar entregador com sucesso (apenas admin)', async () => {
      const response = await request(app)
        .put(`/api/delivery/persons/${testDeliveryPerson.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Delivery Person',
          isAvailable: false
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Delivery Person');
      expect(response.body.isAvailable).toBe(false);
    });

    it('deve retornar erro 403 para usuário não admin', async () => {
      const response = await request(app)
        .put(`/api/delivery/persons/${testDeliveryPerson.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Delivery Person'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/delivery/persons', () => {
    it('deve buscar entregadores com sucesso (apenas admin)', async () => {
      const response = await request(app)
        .get('/api/delivery/persons')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('deliveryPersons');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });

    it('deve retornar erro 403 para usuário não admin', async () => {
      const response = await request(app)
        .get('/api/delivery/persons')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/delivery/stats', () => {
    let testOrder: any;
    let testAddress: any;

    beforeEach(async () => {
      if (!testUser?.id || !testStore?.id || !testProduct?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }
      
      const orderData = await createTestOrder();
      testOrder = orderData.testOrder;
      testAddress = orderData.testAddress;
      
      await prisma.deliveryTracking.create({
        data: {
          orderId: testOrder.id,
          status: DeliveryStatus.DELIVERED,
          method: DeliveryMethod.DELIVERY,
          trackingCode: 'STATS123',
          locations: []
        }
      });
    });

    afterEach(async () => {
      if (testOrder?.id) {
        await prisma.deliveryTracking.deleteMany({
          where: { orderId: testOrder.id }
        });
        await prisma.order.delete({ where: { id: testOrder.id } });
        await prisma.address.delete({ where: { id: testAddress.id } });
      }
    });

    it('deve buscar estatísticas com sucesso (apenas admin)', async () => {
      const response = await request(app)
        .get('/api/delivery/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalDeliveries');
      expect(response.body).toHaveProperty('completedDeliveries');
      expect(response.body).toHaveProperty('averageDeliveryTime');
    });

    it('deve retornar erro 403 para usuário não admin', async () => {
      const response = await request(app)
        .get('/api/delivery/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/delivery/improvement-stats', () => {
    it('deve buscar estatísticas de melhorias com sucesso (apenas admin)', async () => {
      const response = await request(app)
        .get('/api/delivery/improvement-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalOrders');
      expect(response.body).toHaveProperty('ordersByStatus');
      expect(response.body).toHaveProperty('averageOrderTime');
      expect(response.body).toHaveProperty('onTimeDeliveryRate');
    });

    it('deve retornar erro 403 para usuário não admin', async () => {
      const response = await request(app)
        .get('/api/delivery/improvement-stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/delivery', () => {
    let testOrder: any;
    let testAddress: any;

    beforeEach(async () => {
      if (!testUser?.id || !testStore?.id || !testProduct?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }
      
      const orderData = await createTestOrder();
      testOrder = orderData.testOrder;
      testAddress = orderData.testAddress;
      
      await prisma.deliveryTracking.create({
        data: {
          orderId: testOrder.id,
          status: DeliveryStatus.CONFIRMED,
          method: DeliveryMethod.DELIVERY,
          trackingCode: 'LIST123',
          locations: []
        }
      });
    });

    afterEach(async () => {
      if (testOrder?.id) {
        await prisma.deliveryTracking.deleteMany({
          where: { orderId: testOrder.id }
        });
        await prisma.order.delete({ where: { id: testOrder.id } });
        await prisma.address.delete({ where: { id: testAddress.id } });
      }
    });

    it('deve buscar entregas com sucesso', async () => {
      const response = await request(app)
        .get('/api/delivery')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('deliveries');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
    });

    it('deve filtrar entregas por status', async () => {
      const response = await request(app)
        .get('/api/delivery?status=CONFIRMED')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.deliveries.length).toBeGreaterThan(0);
    });

    it('deve paginar resultados', async () => {
      const response = await request(app)
        .get('/api/delivery?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
    });
  });
});
