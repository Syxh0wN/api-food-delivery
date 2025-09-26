import request from 'supertest';
import app from '../../index';
import { prisma } from '../../config/database';
import { UserRole, OrderStatus } from '@prisma/client';
import { generateToken } from '../../utils/jwt';

describe('Order Routes', () => {
  let clientToken: string;
  let storeOwnerToken: string;
  let testUser: any;
  let testStoreOwner: any;
  let testStore: any;
  let testCategory: any;
  let testProduct: any;
  let testAddress: any;
  let testCart: any;
  let testCartItem: any;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    testUser = await prisma.user.create({
      data: {
        email: `cliente-order-${timestamp}@test.com`,
        password: 'hashedpassword',
        name: 'Cliente Teste',
        role: UserRole.CLIENT
      }
    });

    testStoreOwner = await prisma.user.create({
      data: {
        email: `dono-order-${timestamp}@test.com`,
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
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.address.deleteMany();
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    await prisma.category.deleteMany();

    testCategory = await prisma.category.create({
      data: {
        name: 'Pizza',
        description: 'Pizzas deliciosas'
      }
    });

    testStore = await prisma.store.create({
      data: {
        name: 'Pizzaria Teste',
        description: 'Melhor pizza da cidade',
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

    testProduct = await prisma.product.create({
      data: {
        name: 'Pizza Margherita',
        description: 'Pizza com molho de tomate, mussarela e manjericão',
        price: 35.90,
        categoryId: testCategory.id,
        storeId: testStore.id,
        isAvailable: true,
        preparationTime: 20,
        ingredients: ['molho de tomate', 'mussarela', 'manjericão'],
        allergens: [],
        images: ['pizza1.jpg'],
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        nutritionalInfo: { calories: 250 }
      }
    });

    testAddress = await prisma.address.create({
      data: {
        street: 'Rua do Cliente',
        number: '456',
        neighborhood: 'Vila Nova',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04567890',
        isDefault: true,
        userId: testUser.id
      }
    });

    testCartItem = await prisma.cartItem.create({
      data: {
        userId: testUser.id,
        productId: testProduct.id,
        quantity: 2
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/orders', () => {
    it('deve criar pedido com sucesso', async () => {
      const orderData = {
        storeId: testStore.id,
        addressId: testAddress.id,
        paymentMethod: 'PIX',
        deliveryInstructions: 'Entregar na portaria'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Pedido criado com sucesso');
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.order.status).toBe('PENDING');
      expect(response.body.data.order.paymentMethod).toBe('PIX');
    });

    it('deve falhar sem token de autenticação', async () => {
      const orderData = {
        storeId: testStore.id,
        addressId: testAddress.id,
        paymentMethod: 'PIX'
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Token de acesso requerido');
    });

    it('deve falhar com dados inválidos', async () => {
      const orderData = {
        storeId: 'invalid-id',
        addressId: testAddress.id,
        paymentMethod: 'INVALID_METHOD'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });

    it('deve falhar com carrinho vazio', async () => {
      await prisma.cartItem.deleteMany();

      const orderData = {
        storeId: testStore.id,
        addressId: testAddress.id,
        paymentMethod: 'PIX'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Carrinho vazio');
    });
  });

  describe('GET /api/orders', () => {
    beforeEach(async () => {
      await prisma.order.create({
        data: {
          userId: testUser.id,
          storeId: testStore.id,
          addressId: testAddress.id,
          status: OrderStatus.PENDING,
          subtotal: 71.80,
          deliveryFee: 5,
          total: 76.80,
          paymentMethod: 'PIX',
          items: {
            create: {
              productId: testProduct.id,
              quantity: 2,
              price: 35.90
            }
          }
        }
      });
    });

    it('deve listar pedidos do usuário', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Pedidos obtidos com sucesso');
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.total).toBe(1);
    });

    it('deve falhar sem token de autenticação', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders/:id', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          storeId: testStore.id,
          addressId: testAddress.id,
          status: OrderStatus.PENDING,
          subtotal: 71.80,
          deliveryFee: 5,
          total: 76.80,
          paymentMethod: 'PIX',
          items: {
            create: {
              productId: testProduct.id,
              quantity: 2,
              price: 35.90
            }
          }
        }
      });
    });

    it('deve retornar pedido específico', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.id).toBe(testOrder.id);
    });

    it('deve retornar 404 para pedido inexistente', async () => {
      const response = await request(app)
        .get('/api/orders/pedido-inexistente')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Pedido não encontrado');
    });
  });

  describe('PATCH /api/orders/:id/cancel', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          storeId: testStore.id,
          addressId: testAddress.id,
          status: OrderStatus.PENDING,
          subtotal: 71.80,
          deliveryFee: 5,
          total: 76.80,
          paymentMethod: 'PIX',
          items: {
            create: {
              productId: testProduct.id,
              quantity: 2,
              price: 35.90
            }
          }
        }
      });
    });

    it('deve cancelar pedido com sucesso', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder.id}/cancel`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Pedido cancelado com sucesso');
      expect(response.body.data.order.status).toBe('CANCELLED');
    });

    it('deve falhar ao cancelar pedido de outro usuário', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: `outro-${Date.now()}@test.com`,
          password: 'hashedpassword',
          name: 'Outro Usuário',
          role: UserRole.CLIENT
        }
      });

      const otherToken = generateToken({
        userId: otherUser.id,
        email: otherUser.email,
        role: otherUser.role
      });

      const response = await request(app)
        .patch(`/api/orders/${testOrder.id}/cancel`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/stores/:storeId/orders', () => {
    beforeEach(async () => {
      await prisma.order.create({
        data: {
          userId: testUser.id,
          storeId: testStore.id,
          addressId: testAddress.id,
          status: OrderStatus.PENDING,
          subtotal: 71.80,
          deliveryFee: 5,
          total: 76.80,
          paymentMethod: 'PIX',
          items: {
            create: {
              productId: testProduct.id,
              quantity: 2,
              price: 35.90
            }
          }
        }
      });
    });

    it('deve listar pedidos da loja para dono', async () => {
      const response = await request(app)
        .get(`/api/stores/${testStore.id}/orders`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Pedidos da loja obtidos com sucesso');
      expect(response.body.data.orders).toHaveLength(1);
    });

    it('deve falhar para usuário que não é dono da loja', async () => {
      const response = await request(app)
        .get(`/api/stores/${testStore.id}/orders`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Acesso negado');
    });
  });

  describe('PATCH /api/stores/:storeId/orders/:id/status', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          storeId: testStore.id,
          addressId: testAddress.id,
          status: OrderStatus.PENDING,
          subtotal: 71.80,
          deliveryFee: 5,
          total: 76.80,
          paymentMethod: 'PIX',
          items: {
            create: {
              productId: testProduct.id,
              quantity: 2,
              price: 35.90
            }
          }
        }
      });
    });

    it('deve atualizar status do pedido', async () => {
      const response = await request(app)
        .patch(`/api/stores/${testStore.id}/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Status do pedido atualizado com sucesso');
      expect(response.body.data.order.status).toBe('CONFIRMED');
    });

    it('deve falhar com status inválido', async () => {
      const response = await request(app)
        .patch(`/api/stores/${testStore.id}/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });

    it('deve falhar para usuário que não é dono da loja', async () => {
      const response = await request(app)
        .patch(`/api/stores/${testStore.id}/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/stores/:storeId/orders/summary', () => {
    beforeEach(async () => {
      await prisma.order.createMany({
        data: [
          {
            userId: testUser.id,
            storeId: testStore.id,
            addressId: testAddress.id,
            status: OrderStatus.PENDING,
            subtotal: 35.90,
            deliveryFee: 5,
            total: 40.90,
            paymentMethod: 'PIX'
          },
          {
            userId: testUser.id,
            storeId: testStore.id,
            addressId: testAddress.id,
            status: OrderStatus.DELIVERED,
            subtotal: 71.80,
            deliveryFee: 5,
            total: 76.80,
            paymentMethod: 'PIX'
          }
        ]
      });
    });

    it('deve retornar resumo dos pedidos da loja', async () => {
      const response = await request(app)
        .get(`/api/stores/${testStore.id}/orders/summary`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Resumo dos pedidos obtido com sucesso');
      expect(response.body.data.summary.totalOrders).toBe(2);
      expect(response.body.data.summary.pendingOrders).toBe(1);
      expect(response.body.data.summary.deliveredOrders).toBe(1);
      expect(response.body.data.summary.totalRevenue).toBe(76.80);
    });

    it('deve falhar para usuário que não é dono da loja', async () => {
      const response = await request(app)
        .get(`/api/stores/${testStore.id}/orders/summary`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
