import { OrderService } from '../../services/orderService';
import { prisma } from '../../config/database';
import { UserRole, OrderStatus } from '@prisma/client';

describe('OrderService', () => {
  let orderService: OrderService;
  let testUser: any;
  let testStoreOwner: any;
  let testStore: any;
  let testCategory: any;
  let testProduct: any;
  let testAddress: any;
  let testCartItem: any;

  beforeAll(async () => {
    orderService = new OrderService();
  });

  beforeEach(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.address.deleteMany();
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    testUser = await prisma.user.create({
      data: {
        email: 'cliente@test.com',
        password: 'hashedpassword',
        name: 'Cliente Teste',
        role: UserRole.CLIENT
      }
    });

    testStoreOwner = await prisma.user.create({
      data: {
        email: 'dono@test.com',
        password: 'hashedpassword',
        name: 'Dono Teste',
        role: UserRole.STORE_OWNER
      }
    });

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
        email: 'dono@test.com',
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

  describe('createOrder', () => {
    it('deve criar pedido com sucesso', async () => {
      const orderData = {
        storeId: testStore.id,
        addressId: testAddress.id,
        paymentMethod: 'PIX' as const,
        deliveryInstructions: 'Entregar na portaria'
      };

      const order = await orderService.createOrder(testUser.id, orderData);

      expect(order).toBeDefined();
      expect(order.userId).toBe(testUser.id);
      expect(order.storeId).toBe(testStore.id);
      expect(order.addressId).toBe(testAddress.id);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.paymentMethod).toBe('PIX');
      expect(order.deliveryInstructions).toBe('Entregar na portaria');
      expect(order.items).toHaveLength(1);
      expect(order.items[0]?.productId).toBe(testProduct.id);
      expect(order.items[0]?.quantity).toBe(2);
      expect(order.total).toBeGreaterThan(0);
    });

    it('deve falhar ao criar pedido com carrinho vazio', async () => {
      await prisma.cartItem.deleteMany();

      const orderData = {
        storeId: testStore.id,
        addressId: testAddress.id,
        paymentMethod: 'PIX' as const
      };

      await expect(orderService.createOrder(testUser.id, orderData))
        .rejects.toThrow('Carrinho vazio');
    });

    it('deve falhar ao criar pedido para loja fechada', async () => {
      await prisma.store.update({
        where: { id: testStore.id },
        data: { isOpen: false }
      });

      const orderData = {
        storeId: testStore.id,
        addressId: testAddress.id,
        paymentMethod: 'PIX' as const
      };

      await expect(orderService.createOrder(testUser.id, orderData))
        .rejects.toThrow('Loja está fechada');
    });

    it('deve falhar ao criar pedido com valor abaixo do mínimo', async () => {
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { price: 5 }
      });

      const orderData = {
        storeId: testStore.id,
        addressId: testAddress.id,
        paymentMethod: 'PIX' as const
      };

      await expect(orderService.createOrder(testUser.id, orderData))
        .rejects.toThrow('Valor mínimo do pedido é R$ 25');
    });
  });

  describe('getUserOrders', () => {
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

    it('deve retornar pedidos do usuário', async () => {
      const result = await orderService.getUserOrders(testUser.id, 1, 10);

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.orders[0]?.userId).toBe(testUser.id);
    });

    it('deve retornar lista vazia quando usuário não tem pedidos', async () => {
      const result = await orderService.getUserOrders('user-inexistente', 1, 10);

      expect(result.orders).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getStoreOrders', () => {
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

    it('deve retornar pedidos da loja', async () => {
      const result = await orderService.getStoreOrders(testStore.id, testStoreOwner.id, 1, 10);

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.orders[0]?.storeId).toBe(testStore.id);
    });

    it('deve falhar ao tentar acessar pedidos de loja que não pertence ao usuário', async () => {
      await expect(orderService.getStoreOrders(testStore.id, 'outro-usuario', 1, 10))
        .rejects.toThrow('Loja não encontrada ou não pertence ao usuário');
    });
  });

  describe('getOrderById', () => {
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

    it('deve retornar pedido quando encontrado', async () => {
      const order = await orderService.getOrderById(testOrder.id, testUser.id);

      expect(order).toBeDefined();
      expect(order.id).toBe(testOrder.id);
      expect(order.userId).toBe(testUser.id);
    });

    it('deve retornar pedido para dono da loja', async () => {
      const order = await orderService.getOrderById(testOrder.id, testStoreOwner.id);

      expect(order).toBeDefined();
      expect(order.id).toBe(testOrder.id);
    });

    it('deve falhar ao tentar acessar pedido de outro usuário', async () => {
      await expect(orderService.getOrderById(testOrder.id, 'outro-usuario'))
        .rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('updateOrderStatus', () => {
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
      const updatedOrder = await orderService.updateOrderStatus(
        testOrder.id,
        testStore.id,
        testStoreOwner.id,
        { status: OrderStatus.CONFIRMED }
      );

      expect(updatedOrder.status).toBe(OrderStatus.CONFIRMED);
    });

    it('deve falhar ao atualizar pedido de outra loja', async () => {
      await expect(orderService.updateOrderStatus(
        testOrder.id,
        'outra-loja',
        testStoreOwner.id,
        { status: OrderStatus.CONFIRMED }
      )).rejects.toThrow('Loja não encontrada ou não pertence ao usuário');
    });
  });

  describe('cancelOrder', () => {
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

    it('deve cancelar pedido pendente', async () => {
      const cancelledOrder = await orderService.cancelOrder(testOrder.id, testUser.id);

      expect(cancelledOrder.status).toBe(OrderStatus.CANCELLED);
    });

    it('deve falhar ao cancelar pedido que não pertence ao usuário', async () => {
      await expect(orderService.cancelOrder(testOrder.id, 'outro-usuario'))
        .rejects.toThrow('Pedido não encontrado');
    });

    it('deve falhar ao cancelar pedido que não está pendente', async () => {
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { status: OrderStatus.CONFIRMED }
      });

      await expect(orderService.cancelOrder(testOrder.id, testUser.id))
        .rejects.toThrow('Apenas pedidos pendentes podem ser cancelados');
    });
  });

  describe('getOrderSummary', () => {
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
      const summary = await orderService.getOrderSummary(testStore.id, testStoreOwner.id);

      expect(summary.totalOrders).toBe(2);
      expect(summary.pendingOrders).toBe(1);
      expect(summary.deliveredOrders).toBe(1);
      expect(summary.totalRevenue).toBe(76.80);
    });

    it('deve falhar ao tentar acessar resumo de loja que não pertence ao usuário', async () => {
      await expect(orderService.getOrderSummary(testStore.id, 'outro-usuario'))
        .rejects.toThrow('Loja não encontrada ou não pertence ao usuário');
    });
  });
});