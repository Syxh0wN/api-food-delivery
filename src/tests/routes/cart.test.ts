import request from 'supertest';
import app from '../../index';
import { prisma } from '../setup';

describe('Cart Routes', () => {
  let authToken: string;
  let testUserId: string;
  let testStoreId: string;
  let testCategoryId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Criar usuário de teste
    const { AuthService } = await import('../../services/authService');
    const authService = new AuthService();
    const timestamp = Date.now();
    const result = await authService.register({
      email: `teste-carrinho-${timestamp}@teste.com`,
      password: 'password123',
      name: 'Usuário Teste Carrinho',
      role: 'CLIENT'
    });
    testUserId = result.user.id;
    authToken = result.token;

    // Criar loja de teste
    const testStore = await prisma.store.create({
      data: {
        name: 'Loja Teste Carrinho',
        description: 'Loja para testes de carrinho',
        phone: '11999999999',
        email: `teste-carrinho-${timestamp}@teste.com`,
        address: {
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567'
        },
        deliveryRadius: 5,
        estimatedDeliveryTime: 30,
        minimumOrderValue: 20,
        ownerId: testUserId
      }
    });
    testStoreId = testStore.id;

    // Criar categoria de teste
    const testCategory = await prisma.category.create({
      data: {
        name: `Categoria Teste Carrinho ${timestamp}`,
        description: 'Categoria para testes de carrinho'
      }
    });
    testCategoryId = testCategory.id;

    // Criar produto de teste
    const testProduct = await prisma.product.create({
      data: {
        name: 'Produto Teste Carrinho',
        description: 'Produto para testes de carrinho',
        price: 25.90,
        categoryId: testCategoryId,
        storeId: testStoreId,
        isAvailable: true,
        nutritionalInfo: {}
      }
    });
    testProductId = testProduct.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/cart', () => {
    it('deve obter carrinho vazio inicialmente', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.totalItems).toBe(0);
      expect(response.body.data.cart.totalValue).toBe(0);
    });

    it('deve falhar sem token de autenticação', async () => {
      const response = await request(app)
        .get('/api/cart')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/cart/items', () => {
    it('deve adicionar produto ao carrinho com sucesso', async () => {
      const itemData = {
        productId: testProductId,
        quantity: 2
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cartItem.productId).toBe(testProductId);
      expect(response.body.data.cartItem.quantity).toBe(2);
      expect(response.body.data.cartItem.product.name).toBe('Produto Teste Carrinho');
    });

    it('deve aumentar quantidade ao adicionar produto existente', async () => {
      const itemData = {
        productId: testProductId,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cartItem.quantity).toBe(3); // 2 + 1
    });

    it('deve falhar com dados inválidos', async () => {
      const itemData = {
        productId: 'invalid-id',
        quantity: 0
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });

    it('deve falhar com produto inexistente', async () => {
      const itemData = {
        productId: 'cmg07vee1000htqm4af28hsrk', // ID válido mas inexistente
        quantity: 1
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Produto não encontrado');
    });
  });

  describe('GET /api/cart/summary', () => {
    it('deve obter resumo do carrinho', async () => {
      const response = await request(app)
        .get('/api/cart/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalItems).toBe(3);
      expect(response.body.data.summary.totalValue).toBeCloseTo(77.7, 1); // 3 * 25.90
      expect(response.body.data.summary.itemsCount).toBe(1);
    });
  });

  describe('PUT /api/cart/items/:itemId', () => {
    let cartItemId: string;

    beforeAll(async () => {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: testUserId },
        include: { product: true }
      });
      cartItemId = cartItems[0]?.id || '';
    });

    it('deve atualizar quantidade do item', async () => {
      const updateData = {
        quantity: 5
      };

      const response = await request(app)
        .put(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cartItem.quantity).toBe(5);
    });

    it('deve falhar com quantidade inválida', async () => {
      const updateData = {
        quantity: 0
      };

      const response = await request(app)
        .put(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });

    it('deve falhar com item inexistente', async () => {
      const updateData = {
        quantity: 2
      };

      const response = await request(app)
        .put('/api/cart/items/item-inexistente')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item não encontrado no carrinho');
    });
  });

  describe('DELETE /api/cart/items/:itemId', () => {
    let cartItemId: string;

    beforeAll(async () => {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: testUserId },
        include: { product: true }
      });
      cartItemId = cartItems[0]?.id || '';
    });

    it('deve remover item do carrinho', async () => {
      const response = await request(app)
        .delete(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Item removido do carrinho com sucesso');
    });

    it('deve falhar ao tentar remover item inexistente', async () => {
      const response = await request(app)
        .delete('/api/cart/items/item-inexistente')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item não encontrado no carrinho');
    });
  });

  describe('DELETE /api/cart', () => {
    beforeAll(async () => {
      // Adicionar alguns itens para testar limpeza
      await prisma.cartItem.create({
        data: {
          userId: testUserId,
          productId: testProductId,
          quantity: 2
        }
      });
    });

    it('deve limpar carrinho completamente', async () => {
      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Carrinho limpo com sucesso');

      // Verificar se carrinho está vazio
      const cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(cartResponse.body.data.cart.items).toHaveLength(0);
      expect(cartResponse.body.data.cart.totalItems).toBe(0);
    });
  });
});
