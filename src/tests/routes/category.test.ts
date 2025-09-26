import request from 'supertest';
import app from '../../index';
import { prisma } from '../setup';

describe('Category Routes', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Criar usuário de teste usando o serviço de auth para fazer hash correto
    const { AuthService } = await import('../../services/authService');
    const authService = new AuthService();
    const timestamp = Date.now();
    const result = await authService.register({
      email: `teste-categoria-${timestamp}@teste.com`,
      password: 'password123',
      name: 'Usuário Teste Categoria',
      role: 'STORE_OWNER'
    });
    testUserId = result.user.id;

    // Usar o token do registro em vez de fazer login
    authToken = result.token;
  });

  describe('POST /api/categories', () => {
    it('deve criar categoria com sucesso', async () => {
      const categoryData = {
        name: 'Pizzas',
        description: 'Pizzas tradicionais e especiais'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe(categoryData.name);
      expect(response.body.data.category.description).toBe(categoryData.description);
    });

    it('deve criar categoria sem descrição', async () => {
      const categoryData = {
        name: 'Bebidas'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe(categoryData.name);
      expect(response.body.data.category.description).toBeNull();
    });

    it('deve falhar sem token de autenticação', async () => {
      const categoryData = {
        name: 'Categoria Sem Auth',
        description: 'Categoria sem autenticação'
      };

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('deve falhar com dados inválidos', async () => {
      const categoryData = {
        name: 'A', // Nome muito curto
        description: 'Descrição'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });

    it('deve falhar ao criar categoria com nome duplicado', async () => {
      const categoryData = {
        name: 'Categoria Duplicada',
        description: 'Primeira categoria'
      };

      // Criar primeira categoria
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      // Tentar criar segunda categoria com mesmo nome
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Categoria com este nome já existe');
    });
  });

  describe('GET /api/categories', () => {
    it('deve listar todas as categorias', async () => {
      // Criar algumas categorias
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Categoria 1' });

      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Categoria 2' });

      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toBeDefined();
      expect(Array.isArray(response.body.data.categories)).toBe(true);
    });

    it('deve retornar categorias ordenadas por nome', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const categories = response.body.data.categories;
      if (categories.length >= 2) {
        expect(categories[0].name <= categories[1].name).toBe(true);
      }
    });
  });

  describe('GET /api/categories/:id', () => {
    it('deve retornar categoria específica', async () => {
      // Criar categoria
      const createResponse = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Categoria Específica', description: 'Para teste' });

      const categoryId = createResponse.body.data.category.id;

      const response = await request(app)
        .get(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.id).toBe(categoryId);
      expect(response.body.data.category.name).toBe('Categoria Específica');
    });

    it('deve retornar 404 para categoria inexistente', async () => {
      const response = await request(app)
        .get('/api/categories/categoria-inexistente')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Categoria não encontrada');
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('deve atualizar categoria com sucesso', async () => {
      // Criar categoria
      const createResponse = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Categoria Original', description: 'Descrição original' });

      const categoryId = createResponse.body.data.category.id;

      const updateData = {
        name: 'Categoria Atualizada',
        description: 'Descrição atualizada'
      };

      const response = await request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe(updateData.name);
      expect(response.body.data.category.description).toBe(updateData.description);
    });

    it('deve retornar 404 para categoria inexistente', async () => {
      const updateData = {
        name: 'Categoria Atualizada'
      };

      const response = await request(app)
        .put('/api/categories/categoria-inexistente')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Categoria não encontrada');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('deve excluir categoria com sucesso', async () => {
      // Criar categoria
      const createResponse = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Categoria Para Excluir' });

      const categoryId = createResponse.body.data.category.id;

      const response = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Categoria excluída com sucesso');

      // Verificar se foi excluída
      const getResponse = await request(app)
        .get(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(getResponse.body.message).toBe('Categoria não encontrada');
    });

    it('deve retornar 400 para categoria inexistente', async () => {
      const response = await request(app)
        .delete('/api/categories/categoria-inexistente')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Categoria não encontrada');
    });
  });

  afterAll(async () => {
    // Fechar conexões e limpar recursos
    await prisma.$disconnect();
  });
});
