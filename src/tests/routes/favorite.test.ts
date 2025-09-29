import request from 'supertest';
import app from '../../index';
import { prisma } from '../../config/database';
import { hashPassword } from '../../utils/hash';
import { FavoriteType, UserRole, OrderStatus } from '@prisma/client';

describe('Sistema de Favoritos', () => {
  let testUser: any;
  let testStoreOwner: any;
  let testStore: any;
  let testProduct: any;
  let testOrder: any;
  let authToken: string;
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
    // Setup test users
    let existingUser = await prisma.user.findUnique({ where: { email: 'test-favorites@example.com' } });
    if (!existingUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test-favorites@example.com',
          password: await hashPassword('password123'),
          name: 'Test User Favorites',
          role: UserRole.CLIENT
        }
      });
    } else {
      testUser = existingUser;
      await prisma.user.update({ where: { id: testUser.id }, data: { password: await hashPassword('password123') } });
    }

    let existingStoreOwner = await prisma.user.findUnique({ where: { email: 'store-owner-favorites@example.com' } });
    if (!existingStoreOwner) {
      testStoreOwner = await prisma.user.create({
        data: {
          email: 'store-owner-favorites@example.com',
          password: await hashPassword('password123'),
          name: 'Store Owner Favorites',
          role: UserRole.STORE_OWNER
        }
      });
    } else {
      testStoreOwner = existingStoreOwner;
      await prisma.user.update({ where: { id: existingStoreOwner.id }, data: { password: await hashPassword('password123') } });
    }

    let existingAdmin = await prisma.user.findUnique({ where: { email: 'admin-favorites@example.com' } });
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          email: 'admin-favorites@example.com',
          password: await hashPassword('adminpassword'),
          name: 'Admin Favorites',
          role: UserRole.ADMIN
        }
      });
    } else {
      await prisma.user.update({ where: { id: existingAdmin.id }, data: { password: await hashPassword('adminpassword') } });
    }

    // Setup test store
    let existingStore = await prisma.store.findFirst({ where: { name: 'Test Store Favorites' } });
    if (!existingStore) {
      testStore = await prisma.store.create({
        data: {
          name: 'Test Store Favorites',
          description: 'Test store for favorites',
          phone: '123456789',
          email: 'store-favorites@example.com',
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
          ownerId: testStoreOwner.id
        }
      });
    } else {
      testStore = existingStore;
    }

    // Setup test category
    let existingCategory = await prisma.category.findUnique({ where: { name: 'Test Category Favorites' } });
    let testCategory: any;
    if (!existingCategory) {
      testCategory = await prisma.category.create({
        data: {
          name: 'Test Category Favorites',
          description: 'Test category for favorites'
        }
      });
    } else {
      testCategory = existingCategory;
    }

    // Setup test product
    let existingProduct = await prisma.product.findFirst({ where: { categoryId: testCategory.id, storeId: testStore.id } });
    if (!existingProduct) {
      testProduct = await prisma.product.create({
        data: {
          name: 'Test Product Favorites',
          description: 'Test product for favorites',
          price: 15.99,
          categoryId: testCategory.id,
          storeId: testStore.id,
          ingredients: ['ingredient1', 'ingredient2'],
          allergens: ['allergen1'],
          images: ['image1.jpg'],
          nutritionalInfo: { calories: 100 }
        }
      });
    } else {
      testProduct = existingProduct;
    }

    // Login as test user
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test-favorites@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.data.token;

    // Login as admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin-favorites@example.com',
        password: 'adminpassword'
      });
    adminToken = adminLoginResponse.body.data.token;
  });

  afterAll(async () => {
    // Cleanup in reverse order of creation to avoid foreign key issues
    try {
      await prisma.favorite.deleteMany({
        where: { userId: testUser?.id }
      });
    } catch (error) { console.error('Error deleting favorites:', error); }

    try {
      await prisma.favoriteList.deleteMany({
        where: { userId: testUser?.id }
      });
    } catch (error) { console.error('Error deleting favorite lists:', error); }

    try {
      if (testOrder) await prisma.order.delete({ where: { id: testOrder.id } });
    } catch (error) { console.error('Error deleting order:', error); }

    try {
      const orderItems = await prisma.orderItem.findMany({ where: { orderId: testOrder?.id } });
      if (orderItems.length > 0) {
        await prisma.orderItem.deleteMany({ where: { orderId: testOrder?.id } });
      }
    } catch (error) { console.error('Error deleting order items:', error); }

    try {
      if (testProduct) await prisma.product.delete({ where: { id: testProduct.id } });
    } catch (error) { console.error('Error deleting product:', error); }

    try {
      const category = await prisma.category.findUnique({ where: { name: 'Test Category Favorites' } });
      if (category) await prisma.category.delete({ where: { id: category.id } });
    } catch (error) { console.error('Error deleting category:', error); }

    try {
      if (testStore) await prisma.store.delete({ where: { id: testStore.id } });
    } catch (error) { console.error('Error deleting store:', error); }

    try {
      const address = await prisma.address.findFirst({ where: { userId: testUser?.id } });
      if (address) await prisma.address.delete({ where: { id: address.id } });
    } catch (error) { console.error('Error deleting address:', error); }

    try {
      if (testUser) await prisma.user.delete({ where: { id: testUser.id } });
    } catch (error) { console.error('Error deleting test user:', error); }

    try {
      if (testStoreOwner) await prisma.user.delete({ where: { id: testStoreOwner.id } });
    } catch (error) { console.error('Error deleting store owner:', error); }

    try {
      const adminUser = await prisma.user.findUnique({ where: { email: 'admin-favorites@example.com' } });
      if (adminUser) await prisma.user.delete({ where: { id: adminUser.id } });
    } catch (error) { console.error('Error deleting admin user:', error); }
  });

  describe('POST /api/favorites', () => {
    it('deve criar favorito com sucesso', async () => {
      if (!testUser?.id || !testStore?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      const response = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId: testStore.id,
          type: FavoriteType.STORE,
          notes: 'Minha loja favorita'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.itemId).toBe(testStore.id);
      expect(response.body.type).toBe(FavoriteType.STORE);
      expect(response.body.notes).toBe('Minha loja favorita');
    });

    it('deve criar favorito de produto com sucesso', async () => {
      if (!testUser?.id || !testProduct?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      const response = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId: testProduct.id,
          type: FavoriteType.PRODUCT,
          tags: ['delicioso', 'barato']
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.itemId).toBe(testProduct.id);
      expect(response.body.type).toBe(FavoriteType.PRODUCT);
      expect(response.body.tags).toEqual(['delicioso', 'barato']);
    });

    it('deve falhar com dados inválidos', async () => {
      const response = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId: 'invalid-id',
          type: 'INVALID_TYPE'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Dados inválidos');
    });

    it('deve falhar sem autenticação', async () => {
      const response = await request(app)
        .post('/api/favorites')
        .send({
          itemId: testStore.id,
          type: FavoriteType.STORE
        });

      expect(response.status).toBe(401);
    });

    it('deve falhar ao tentar favoritar item inexistente', async () => {
      const response = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId: 'nonexistent-id',
          type: FavoriteType.STORE
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Dados inválidos');
    });
  });

  describe('GET /api/favorites', () => {
  beforeEach(async () => {
    if (!testUser?.id || !testStore?.id || !testProduct?.id) {
      throw new Error('Dados de teste não foram criados corretamente');
    }

    // Limpar favoritos existentes antes de cada teste
    await prisma.favorite.deleteMany({
      where: { userId: testUser.id }
    });

    // Criar alguns favoritos para teste
    await prisma.favorite.createMany({
      data: [
        {
          userId: testUser.id,
          itemId: testStore.id,
          type: FavoriteType.STORE,
          notes: 'Loja favorita'
        },
        {
          userId: testUser.id,
          itemId: testProduct.id,
          type: FavoriteType.PRODUCT,
          tags: ['teste']
        }
      ]
    });
  });

    afterEach(async () => {
      if (testUser?.id) {
        await prisma.favorite.deleteMany({
          where: { userId: testUser.id }
        });
      }
    });

    it('deve buscar favoritos com sucesso', async () => {
      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('favorites');
      expect(response.body.favorites).toBeInstanceOf(Array);
      expect(response.body.favorites.length).toBeGreaterThanOrEqual(2);
    });

    it('deve filtrar favoritos por tipo', async () => {
      const response = await request(app)
        .get(`/api/favorites?type=${FavoriteType.STORE}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.favorites.every((fav: any) => fav.type === FavoriteType.STORE)).toBe(true);
    });

    it('deve paginar resultados', async () => {
      const response = await request(app)
        .get('/api/favorites?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.favorites).toHaveLength(1);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(1);
    });
  });

  describe('POST /api/favorites/lists', () => {
    it('deve criar lista de favoritos com sucesso', async () => {
      if (!testUser?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      const response = await request(app)
        .post('/api/favorites/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Minhas Lojas Favoritas',
          description: 'Lista das melhores lojas',
          isPublic: true,
          tags: ['lojas', 'favoritas'],
          color: '#FF5733'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Minhas Lojas Favoritas');
      expect(response.body.isPublic).toBe(true);
      expect(response.body.tags).toEqual(['lojas', 'favoritas']);
      expect(response.body.color).toBe('#FF5733');
    });

    it('deve criar lista privada por padrão', async () => {
      if (!testUser?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      const response = await request(app)
        .post('/api/favorites/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Lista Privada'
        });

      expect(response.status).toBe(201);
      expect(response.body.isPublic).toBe(false);
    });

    it('deve falhar com dados inválidos', async () => {
      const response = await request(app)
        .post('/api/favorites/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Nome vazio
          description: 'a'.repeat(501) // Descrição muito longa
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Dados inválidos');
    });
  });

  describe('GET /api/favorites/lists', () => {
    let testList: any;

    beforeEach(async () => {
      if (!testUser?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      // Limpar listas existentes
      await prisma.favoriteList.deleteMany({
        where: { userId: testUser.id }
      });

      testList = await prisma.favoriteList.create({
        data: {
          userId: testUser.id,
          name: 'Lista de Teste',
          description: 'Lista para testes',
          isPublic: true,
          tags: ['teste']
        }
      });
    });

    afterEach(async () => {
      if (testList?.id) {
        await prisma.favoriteList.delete({ where: { id: testList.id } });
      }
    });

    it('deve buscar listas de favoritos com sucesso', async () => {
      const response = await request(app)
        .get('/api/favorites/lists')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('lists');
      expect(response.body.lists).toBeInstanceOf(Array);
      expect(response.body.lists.length).toBeGreaterThanOrEqual(1);
    });

    it('deve buscar lista específica por ID', async () => {
      const response = await request(app)
        .get(`/api/favorites/lists/${testList.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testList.id);
      expect(response.body.name).toBe('Lista de Teste');
    });

    it('deve filtrar listas públicas', async () => {
      const response = await request(app)
        .get('/api/favorites/lists?isPublic=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.lists.every((list: any) => list.isPublic === true)).toBe(true);
    });
  });

  describe('POST /api/favorites/toggle/:type/:itemId', () => {
    it('deve adicionar favorito quando não existe', async () => {
      if (!testUser?.id || !testStore?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      const response = await request(app)
        .post(`/api/favorites/toggle/${FavoriteType.STORE}/${testStore.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isFavorited).toBe(true);
      expect(response.body.favoriteId).toBeDefined();

      // Limpar
      await prisma.favorite.delete({ where: { id: response.body.favoriteId } });
    });

    it('deve remover favorito quando já existe', async () => {
      if (!testUser?.id || !testStore?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      // Criar favorito primeiro
      const favorite = await prisma.favorite.create({
        data: {
          userId: testUser.id,
          itemId: testStore.id,
          type: FavoriteType.STORE
        }
      });

      const response = await request(app)
        .post(`/api/favorites/toggle/${FavoriteType.STORE}/${testStore.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isFavorited).toBe(false);
      expect(response.body.favoriteId).toBeNull();
    });
  });

  describe('GET /api/favorites/status/:type/:itemId', () => {
    it('deve verificar status de favorito quando não existe', async () => {
      if (!testUser?.id || !testStore?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      const response = await request(app)
        .get(`/api/favorites/status/${FavoriteType.STORE}/${testStore.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isFavorited).toBe(false);
      expect(response.body.favoriteId).toBeNull();
    });

    it('deve verificar status de favorito quando existe', async () => {
      if (!testUser?.id || !testStore?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      // Criar favorito primeiro
      const favorite = await prisma.favorite.create({
        data: {
          userId: testUser.id,
          itemId: testStore.id,
          type: FavoriteType.STORE
        }
      });

      const response = await request(app)
        .get(`/api/favorites/status/${FavoriteType.STORE}/${testStore.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isFavorited).toBe(true);
      expect(response.body.favoriteId).toBe(favorite.id);

      // Limpar
      await prisma.favorite.delete({ where: { id: favorite.id } });
    });
  });

  describe('GET /api/favorites/stats', () => {
    beforeEach(async () => {
      if (!testUser?.id || !testStore?.id || !testProduct?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      // Limpar favoritos existentes
      await prisma.favorite.deleteMany({
        where: { userId: testUser.id }
      });

      // Criar alguns favoritos para estatísticas
      await prisma.favorite.createMany({
        data: [
          {
            userId: testUser.id,
            itemId: testStore.id,
            type: FavoriteType.STORE
          },
          {
            userId: testUser.id,
            itemId: testProduct.id,
            type: FavoriteType.PRODUCT
          }
        ]
      });
    });

    afterEach(async () => {
      if (testUser?.id) {
        await prisma.favorite.deleteMany({
          where: { userId: testUser.id }
        });
      }
    });

    it('deve buscar estatísticas de favoritos com sucesso', async () => {
      const response = await request(app)
        .get('/api/favorites/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalFavorites');
      expect(response.body).toHaveProperty('favoritesByType');
      expect(response.body).toHaveProperty('userStats');
      expect(response.body.totalFavorites).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/favorites/recommendations', () => {
    beforeEach(async () => {
      if (!testUser?.id || !testStore?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      // Limpar favoritos existentes
      await prisma.favorite.deleteMany({
        where: { userId: testUser.id }
      });

      // Criar favorito para gerar recomendações
      await prisma.favorite.create({
        data: {
          userId: testUser.id,
          itemId: testStore.id,
          type: FavoriteType.STORE
        }
      });
    });

    afterEach(async () => {
      if (testUser?.id) {
        await prisma.favorite.deleteMany({
          where: { userId: testUser.id }
        });
      }
    });

    it('deve buscar recomendações com sucesso', async () => {
      const response = await request(app)
        .get('/api/favorites/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });

    it('deve limitar número de recomendações', async () => {
      const response = await request(app)
        .get('/api/favorites/recommendations?limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/favorites/export', () => {
    beforeEach(async () => {
      if (!testUser?.id || !testStore?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      // Limpar dados existentes
      await prisma.favorite.deleteMany({
        where: { userId: testUser.id }
      });
      await prisma.favoriteList.deleteMany({
        where: { userId: testUser.id }
      });

      // Criar dados para exportação
      const list = await prisma.favoriteList.create({
        data: {
          userId: testUser.id,
          name: 'Lista para Export',
          isPublic: false
        }
      });

      await prisma.favorite.create({
        data: {
          userId: testUser.id,
          itemId: testStore.id,
          type: FavoriteType.STORE,
          listId: list.id
        }
      });
    });

    afterEach(async () => {
      if (testUser?.id) {
        await prisma.favorite.deleteMany({
          where: { userId: testUser.id }
        });
        await prisma.favoriteList.deleteMany({
          where: { userId: testUser.id }
        });
      }
    });

    it('deve exportar favoritos em formato JSON', async () => {
      const response = await request(app)
        .get('/api/favorites/export?format=json')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('format', 'json');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('lists');
      expect(response.body.data).toHaveProperty('favorites');
      expect(response.body.data).toHaveProperty('metadata');
    });
  });

  describe('PUT /api/favorites/:favoriteId', () => {
    let testFavorite: any;

    beforeEach(async () => {
      if (!testUser?.id || !testStore?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      testFavorite = await prisma.favorite.create({
        data: {
          userId: testUser.id,
          itemId: testStore.id,
          type: FavoriteType.STORE,
          notes: 'Nota original'
        }
      });
    });

    afterEach(async () => {
      if (testFavorite?.id) {
        await prisma.favorite.delete({ where: { id: testFavorite.id } });
      }
    });

    it('deve atualizar favorito com sucesso', async () => {
      const response = await request(app)
        .put(`/api/favorites/${testFavorite.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Nota atualizada',
          tags: ['atualizado']
        });

      expect(response.status).toBe(200);
      expect(response.body.notes).toBe('Nota atualizada');
      expect(response.body.tags).toEqual(['atualizado']);
    });

    it('deve falhar ao atualizar favorito de outro usuário', async () => {
      // Criar outro usuário
      let otherUser = await prisma.user.findUnique({ where: { email: 'other-user-favorites@example.com' } });
      if (!otherUser) {
        otherUser = await prisma.user.create({
          data: {
            email: 'other-user-favorites@example.com',
            password: await hashPassword('password123'),
            name: 'Other User Favorites',
            role: UserRole.CLIENT
          }
        });
      }

      const otherUserToken = (await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other-user-favorites@example.com',
          password: 'password123'
        })).body.data.token;

      const response = await request(app)
        .put(`/api/favorites/${testFavorite.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          notes: 'Tentativa de atualização'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Erro interno do servidor');

      // Limpar usuário
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('DELETE /api/favorites/:favoriteId', () => {
    let testFavorite: any;

    beforeEach(async () => {
      if (!testUser?.id || !testStore?.id) {
        throw new Error('Dados de teste não foram criados corretamente');
      }

      testFavorite = await prisma.favorite.create({
        data: {
          userId: testUser.id,
          itemId: testStore.id,
          type: FavoriteType.STORE
        }
      });
    });

    it('deve deletar favorito com sucesso', async () => {
      const response = await request(app)
        .delete(`/api/favorites/${testFavorite.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verificar se foi deletado
      const deletedFavorite = await prisma.favorite.findUnique({
        where: { id: testFavorite.id }
      });
      expect(deletedFavorite).toBeNull();
    });

    it('deve falhar ao deletar favorito inexistente', async () => {
      const response = await request(app)
        .delete('/api/favorites/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Erro interno do servidor');
    });
  });
});
