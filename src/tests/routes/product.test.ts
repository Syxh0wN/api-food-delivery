import request from 'supertest';
import app from '../../index';
import { prisma } from '../setup';

describe('Product Routes', () => {
  let authToken: string;
  let testUserId: string;
  let testStoreId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    // Criar usuário de teste usando o serviço de auth para fazer hash correto
    const { AuthService } = await import('../../services/authService');
    const authService = new AuthService();
    const timestamp = Date.now();
    const result = await authService.register({
      email: `teste-produto-${timestamp}@teste.com`,
      password: 'password123',
      name: 'Usuário Teste Produto',
      role: 'STORE_OWNER'
    });
    testUserId = result.user.id;

    // Criar loja de teste
    const testStore = await prisma.store.create({
      data: {
        name: 'Loja Teste',
        description: 'Loja para testes de produtos',
        phone: '11999999999',
        email: `teste-produto-${timestamp}@teste.com`,
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
        name: `Categoria Teste ${timestamp}`,
        description: 'Categoria para testes de produtos'
      }
    });
    testCategoryId = testCategory.id;

    // Usar o token do registro em vez de fazer login
    authToken = result.token;
  });

  describe('POST /api/stores/:storeId/products', () => {
    it('deve criar produto com sucesso', async () => {
      const productData = {
        name: 'Produto Teste',
        description: 'Produto para testes com descrição longa',
        price: 25.90,
        categoryId: testCategoryId,
        isAvailable: true,
        preparationTime: 20,
        ingredients: ['Ingrediente 1', 'Ingrediente 2'],
        allergens: ['Glúten'],
        isVegetarian: true
      };

      const response = await request(app)
        .post(`/api/stores/${testStoreId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(productData.name);
      expect(response.body.data.product.price).toBe(productData.price);
      expect(response.body.data.product.categoryId).toBe(productData.categoryId);
      expect(response.body.data.product.storeId).toBe(testStoreId);
    });

    it('deve criar produto com dados mínimos', async () => {
      const productData = {
        name: 'Produto Simples',
        description: 'Produto simples para testes com descrição',
        price: 15.50,
        categoryId: testCategoryId
      };

      const response = await request(app)
        .post(`/api/stores/${testStoreId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(productData.name);
      expect(response.body.data.product.isAvailable).toBe(true); // Default
    });

    it('deve falhar sem token de autenticação', async () => {
      const productData = {
        name: 'Produto Sem Auth',
        description: 'Produto sem autenticação',
        price: 25.90,
        categoryId: testCategoryId
      };

      const response = await request(app)
        .post(`/api/stores/${testStoreId}/products`)
        .send(productData)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('deve falhar com dados inválidos', async () => {
      const productData = {
        name: 'A', // Nome muito curto
        description: 'Descrição curta', // Descrição muito curta
        price: -10, // Preço negativo
        categoryId: testCategoryId
      };

      const response = await request(app)
        .post(`/api/stores/${testStoreId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });

    it('deve falhar com categoria inexistente', async () => {
      const productData = {
        name: 'Produto Categoria Inexistente',
        description: 'Produto com categoria inexistente',
        price: 25.90,
        categoryId: 'categoria-inexistente'
      };

      const response = await request(app)
        .post(`/api/stores/${testStoreId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Categoria não encontrada');
    });
  });

  describe('GET /api/stores/:storeId/products', () => {
    it('deve listar produtos da loja', async () => {
      // Criar produto de teste
      await request(app)
        .post(`/api/stores/${testStoreId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Produto Para Listar',
          description: 'Produto para teste de listagem',
          price: 20.00,
          categoryId: testCategoryId
        });

      const response = await request(app)
        .get(`/api/stores/${testStoreId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('deve retornar apenas produtos disponíveis', async () => {
      // Criar produto indisponível
      await request(app)
        .post(`/api/stores/${testStoreId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Produto Indisponível',
          description: 'Produto indisponível para testes',
          price: 15.90,
          categoryId: testCategoryId,
          isAvailable: false
        });

      const response = await request(app)
        .get(`/api/stores/${testStoreId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const products = response.body.data.products;
      const unavailableProducts = products.filter((p: any) => !p.isAvailable);
      expect(unavailableProducts).toHaveLength(0);
    });
  });

  describe('GET /api/products', () => {
    it('deve listar todos os produtos', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });
  });

  describe('GET /api/products/:id', () => {
    it('deve retornar produto específico', async () => {
      // Criar produto
      const createResponse = await request(app)
        .post(`/api/stores/${testStoreId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Produto Específico',
          description: 'Produto para teste específico',
          price: 30.00,
          categoryId: testCategoryId
        });

      const productId = createResponse.body.data.product.id;

      const response = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.id).toBe(productId);
      expect(response.body.data.product.name).toBe('Produto Específico');
    });

    it('deve retornar 404 para produto inexistente', async () => {
      const response = await request(app)
        .get('/api/products/produto-inexistente')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Produto não encontrado');
    });
  });

  describe('PUT /api/stores/:storeId/products/:id', () => {
    it('deve atualizar produto com sucesso', async () => {
      // Criar produto
      const createResponse = await request(app)
        .post(`/api/stores/${testStoreId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Produto Original',
          description: 'Produto original para atualização',
          price: 25.00,
          categoryId: testCategoryId
        });

      const productId = createResponse.body.data.product.id;

      const updateData = {
        name: 'Produto Atualizado',
        price: 30.00,
        isAvailable: false
      };

      const response = await request(app)
        .put(`/api/stores/${testStoreId}/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(updateData.name);
      expect(response.body.data.product.price).toBe(updateData.price);
      expect(response.body.data.product.isAvailable).toBe(updateData.isAvailable);
    });

    it('deve retornar 400 para produto inexistente', async () => {
      const updateData = {
        name: 'Produto Atualizado'
      };

      const response = await request(app)
        .put(`/api/stores/${testStoreId}/products/produto-inexistente`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Produto não encontrado ou não pertence ao usuário');
    });
  });

  describe('DELETE /api/stores/:storeId/products/:id', () => {
    it('deve excluir produto com sucesso', async () => {
      // Criar produto
      const createResponse = await request(app)
        .post(`/api/stores/${testStoreId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Produto Para Excluir',
          description: 'Produto para teste de exclusão',
          price: 20.00,
          categoryId: testCategoryId
        });

      const productId = createResponse.body.data.product.id;

      const response = await request(app)
        .delete(`/api/stores/${testStoreId}/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Produto excluído com sucesso');

      // Verificar se foi excluído
      const getResponse = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(getResponse.body.message).toBe('Produto não encontrado');
    });

    it('deve retornar 400 para produto inexistente', async () => {
      const response = await request(app)
        .delete(`/api/stores/${testStoreId}/products/produto-inexistente`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Produto não encontrado ou não pertence ao usuário');
    });
  });

  describe('PATCH /api/stores/:storeId/products/:id/toggle', () => {
    it('deve alternar disponibilidade do produto', async () => {
      // Criar produto disponível
      const createResponse = await request(app)
        .post(`/api/stores/${testStoreId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Produto Para Toggle',
          description: 'Produto para teste de toggle',
          price: 25.00,
          categoryId: testCategoryId,
          isAvailable: true
        });

      const productId = createResponse.body.data.product.id;

      // Alternar para indisponível
      const toggleResponse = await request(app)
        .patch(`/api/stores/${testStoreId}/products/${productId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(toggleResponse.body.success).toBe(true);
      expect(toggleResponse.body.data.product.isAvailable).toBe(false);

      // Alternar novamente para disponível
      const toggleResponse2 = await request(app)
        .patch(`/api/stores/${testStoreId}/products/${productId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(toggleResponse2.body.success).toBe(true);
      expect(toggleResponse2.body.data.product.isAvailable).toBe(true);
    });
  });

  describe('GET /api/products/category/:categoryId', () => {
    it('deve listar produtos por categoria', async () => {
      const response = await request(app)
        .get(`/api/products/category/${testCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
      expect(Array.isArray(response.body.data.products)).toBe(true);

      // Verificar se todos os produtos pertencem à categoria
      const products = response.body.data.products;
      products.forEach((product: any) => {
        expect(product.categoryId).toBe(testCategoryId);
      });
    });
  });

  afterAll(async () => {
    // Fechar conexões e limpar recursos
    await prisma.$disconnect();
  });
});
