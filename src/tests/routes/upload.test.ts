import request from 'supertest';
import app from '../../index';
import { prisma } from '../../config/database';
import { generateToken } from '../../utils/jwt';
import { UserRole, UploadFolder } from '@prisma/client';
import path from 'path';
import fs from 'fs';

describe('Upload Routes', () => {
  let authToken: string;
  let adminToken: string;
  let testUserId: string;
  let adminUserId: string;
  let testProductId: string;
  let testStoreId: string;

  beforeAll(async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test-upload@example.com',
        password: 'hashedpassword',
        name: 'Test Upload User',
        phone: '11999999999',
        role: UserRole.CLIENT
      }
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin-upload@example.com',
        password: 'hashedpassword',
        name: 'Admin Upload User',
        phone: '11999999999',
        role: UserRole.ADMIN
      }
    });

    testUserId = testUser.id;
    adminUserId = adminUser.id;
    
    authToken = generateToken({
      userId: testUserId,
      email: testUser.email,
      role: testUser.role
    });

    adminToken = generateToken({
      userId: adminUserId,
      email: adminUser.email,
      role: adminUser.role
    });

    // Criar loja para testes
    const testStore = await prisma.store.create({
      data: {
        name: 'Test Upload Store',
        description: 'Store for upload tests',
        phone: '11999999999',
        email: 'store@example.com',
        address: {
          street: 'Test Street',
          number: '123',
          city: 'Test City',
          state: 'SP',
          zipCode: '12345-678'
        },
        deliveryRadius: 5.0,
        estimatedDeliveryTime: 30,
        minimumOrderValue: 20.0,
        ownerId: testUserId
      }
    });

    testStoreId = testStore.id;

    // Criar produto para testes
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Upload Product',
        description: 'Product for upload tests',
        price: 25.0,
        categoryId: 'test-category-id',
        storeId: testStoreId,
        images: [],
        nutritionalInfo: {}
      }
    });

    testProductId = testProduct.id;
  });

  afterAll(async () => {
    await prisma.upload.deleteMany({
      where: { userId: { in: [testUserId, adminUserId] } }
    });
    await prisma.product.deleteMany({
      where: { storeId: testStoreId }
    });
    await prisma.store.deleteMany({
      where: { ownerId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, adminUserId] } }
    });
  });

  // Helper para criar arquivo de teste
  const createTestFile = (filename: string, content: string = 'test content') => {
    return Buffer.from(content);
  };

  describe('POST /api/uploads/upload', () => {
    it('deve fazer upload de arquivo com sucesso', async () => {
      const testFile = createTestFile('test.txt', 'Hello World');
      
      const response = await request(app)
        .post('/api/uploads/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('folder', UploadFolder.TEMP)
        .attach('file', testFile, 'test.txt')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.upload).toBeDefined();
      expect(response.body.data.upload.originalName).toBe('test.txt');
      expect(response.body.data.upload.folder).toBe(UploadFolder.TEMP);
    });

    it('deve falhar sem token de autenticação', async () => {
      const testFile = createTestFile('test.txt');
      
      await request(app)
        .post('/api/uploads/upload')
        .field('folder', UploadFolder.TEMP)
        .attach('file', testFile, 'test.txt')
        .expect(401);
    });

    it('deve falhar sem arquivo', async () => {
      const response = await request(app)
        .post('/api/uploads/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('folder', UploadFolder.TEMP)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Nenhum arquivo foi enviado');
    });

    it('deve falhar com pasta inválida', async () => {
      const testFile = createTestFile('test.txt');
      
      const response = await request(app)
        .post('/api/uploads/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('folder', 'invalid-folder')
        .attach('file', testFile, 'test.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });
  });

  describe('POST /api/uploads/presigned-url', () => {
    it('deve gerar URL pré-assinada com sucesso', async () => {
      const requestData = {
        fileName: 'test-image.jpg',
        mimeType: 'image/jpeg',
        folder: UploadFolder.PRODUCTS
      };

      const response = await request(app)
        .post('/api/uploads/presigned-url')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.presignedUrl).toBeDefined();
      expect(response.body.data.presignedUrl.uploadUrl).toBeDefined();
      expect(response.body.data.presignedUrl.key).toBeDefined();
    });

    it('deve falhar sem token de autenticação', async () => {
      const requestData = {
        fileName: 'test-image.jpg',
        mimeType: 'image/jpeg',
        folder: UploadFolder.PRODUCTS
      };

      await request(app)
        .post('/api/uploads/presigned-url')
        .send(requestData)
        .expect(401);
    });

    it('deve falhar com dados inválidos', async () => {
      const requestData = {
        fileName: '',
        mimeType: 'invalid-type',
        folder: 'invalid-folder'
      };

      const response = await request(app)
        .post('/api/uploads/presigned-url')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });
  });

  describe('DELETE /api/uploads/delete', () => {
    it('deve deletar arquivo com sucesso', async () => {
      // Primeiro, fazer upload de um arquivo
      const testFile = createTestFile('delete-test.txt');
      
      const uploadResponse = await request(app)
        .post('/api/uploads/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('folder', UploadFolder.TEMP)
        .attach('file', testFile, 'delete-test.txt')
        .expect(201);

      const fileKey = uploadResponse.body.data.upload.key;

      // Agora deletar o arquivo
      const response = await request(app)
        .delete('/api/uploads/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ key: fileKey })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Arquivo deletado com sucesso');
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .delete('/api/uploads/delete')
        .send({ key: 'test-key' })
        .expect(401);
    });

    it('deve falhar com chave inválida', async () => {
      const response = await request(app)
        .delete('/api/uploads/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ key: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });
  });

  describe('GET /api/uploads/list', () => {
    it('deve listar arquivos do usuário', async () => {
      const response = await request(app)
        .get('/api/uploads/list')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toBeDefined();
      expect(Array.isArray(response.body.data.files.files)).toBe(true);
    });

    it('deve listar arquivos com filtros', async () => {
      const response = await request(app)
        .get('/api/uploads/list?folder=temp&maxKeys=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toBeDefined();
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .get('/api/uploads/list')
        .expect(401);
    });
  });

  describe('POST /api/uploads/avatar', () => {
    it('deve fazer upload de avatar com sucesso', async () => {
      const testImage = createTestFile('avatar.jpg', 'fake-image-data');
      
      const response = await request(app)
        .post('/api/uploads/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImage, 'avatar.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.upload).toBeDefined();
      expect(response.body.data.upload.folder).toBe(UploadFolder.AVATARS);
    });

    it('deve falhar com arquivo que não é imagem', async () => {
      const testFile = createTestFile('test.txt', 'not an image');
      
      const response = await request(app)
        .post('/api/uploads/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testFile, 'test.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Avatar deve ser uma imagem');
    });

    it('deve falhar sem token de autenticação', async () => {
      const testImage = createTestFile('avatar.jpg');
      
      await request(app)
        .post('/api/uploads/avatar')
        .attach('avatar', testImage, 'avatar.jpg')
        .expect(401);
    });
  });

  describe('POST /api/uploads/product/:productId', () => {
    it('deve fazer upload de imagem de produto com sucesso', async () => {
      const testImage = createTestFile('product.jpg', 'fake-image-data');
      
      const response = await request(app)
        .post(`/api/uploads/product/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImage, 'product.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.upload).toBeDefined();
      expect(response.body.data.upload.folder).toBe(UploadFolder.PRODUCTS);
    });

    it('deve falhar para usuário que não é dono do produto', async () => {
      const testImage = createTestFile('product.jpg');
      
      const response = await request(app)
        .post(`/api/uploads/product/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', testImage, 'product.jpg')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Produto não encontrado ou não pertence ao usuário');
    });

    it('deve falhar sem token de autenticação', async () => {
      const testImage = createTestFile('product.jpg');
      
      await request(app)
        .post(`/api/uploads/product/${testProductId}`)
        .attach('image', testImage, 'product.jpg')
        .expect(401);
    });
  });

  describe('POST /api/uploads/variants/:key', () => {
    it('deve gerar variantes de imagem com sucesso', async () => {
      // Primeiro, fazer upload de uma imagem
      const testImage = createTestFile('test-image.jpg', 'fake-image-data');
      
      const uploadResponse = await request(app)
        .post('/api/uploads/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('folder', UploadFolder.TEMP)
        .attach('file', testImage, 'test-image.jpg')
        .expect(201);

      const fileKey = uploadResponse.body.data.upload.key;

      // Gerar variantes
      const response = await request(app)
        .post(`/api/uploads/variants/${fileKey}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.variants).toBeDefined();
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .post('/api/uploads/variants/test-key')
        .expect(401);
    });

    it('deve falhar sem chave do arquivo', async () => {
      const response = await request(app)
        .post('/api/uploads/variants/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Express retorna 404 para rota não encontrada
    });
  });
});
