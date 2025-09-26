import request from 'supertest';
import app from '../../index';
import { prisma } from '../../config/database';
import { generateToken } from '../../utils/jwt';
import { UserRole, SenderType, MessageType } from '@prisma/client';

describe('Chat Routes', () => {
  let testUserId: string;
  let storeOwnerId: string;
  let testOrderId: string;
  let testStoreId: string;
  let testCategoryId: string;
  let testProductId: string;
  let authToken: string;
  let storeOwnerToken: string;

beforeAll(async () => {
  // Verificar se o usuário já existe
  let testUser = await prisma.user.findUnique({
    where: { email: 'test-chat@example.com' }
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test-chat@example.com',
        password: 'hashedpassword',
        name: 'Test Chat User',
        phone: '11999999999',
        role: UserRole.CLIENT
      }
    });
  }

  testUserId = testUser.id;
  authToken = generateToken({ userId: testUserId, email: testUser.email, role: testUser.role });

    // Verificar se o dono da loja já existe
    let storeOwner = await prisma.user.findUnique({
      where: { email: 'store-owner-chat@example.com' }
    });

    if (!storeOwner) {
      storeOwner = await prisma.user.create({
        data: {
          email: 'store-owner-chat@example.com',
          password: 'hashedpassword',
          name: 'Store Owner Chat',
          phone: '11888888888',
          role: UserRole.STORE_OWNER
        }
      });
    }

    storeOwnerId = storeOwner.id;
    storeOwnerToken = generateToken({ userId: storeOwnerId, email: storeOwner.email, role: storeOwner.role });

    // Criar endereço
    const testAddress = await prisma.address.create({
      data: {
        street: 'Rua Test Chat',
        number: '123',
        neighborhood: 'Bairro Test',
        city: 'Cidade Test',
        state: 'SP',
        zipCode: '01234567',
        userId: testUserId
      }
    });

    // Criar categoria
    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Chat Category',
        description: 'Category for chat tests',
        image: 'test-category.jpg'
      }
    });

    testCategoryId = testCategory.id;

    // Criar loja
    const testStore = await prisma.store.create({
      data: {
        name: 'Test Chat Store',
        description: 'Store for chat tests',
        email: 'store-chat@example.com',
        phone: '11777777777',
        address: 'Rua da Loja, 456',
        isOpen: true,
        estimatedDeliveryTime: 30,
        minimumOrderValue: 20.0,
        deliveryRadius: 10.0,
        ownerId: storeOwnerId
      }
    });

    testStoreId = testStore.id;

    // Criar produto
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Chat Product',
        description: 'Product for chat tests',
        price: 25.0,
        categoryId: testCategoryId,
        storeId: testStoreId,
        images: [],
        nutritionalInfo: {}
      }
    });

    testProductId = testProduct.id;

    // Criar pedido
    const testOrder = await prisma.order.create({
      data: {
        userId: testUserId,
        storeId: testStoreId,
        addressId: testAddress.id,
        status: 'PENDING',
        total: 25.0,
        deliveryFee: 5.0,
        subtotal: 20.0,
        paymentMethod: 'credit_card',
        paymentStatus: 'pending'
      }
    });

    testOrderId = testOrder.id;
  });

  afterAll(async () => {
    await prisma.chatMessage.deleteMany({
      where: { room: { orderId: testOrderId } }
    });
    await prisma.chatRoom.deleteMany({
      where: { orderId: testOrderId }
    });
    await prisma.order.deleteMany({
      where: { id: testOrderId }
    });
    await prisma.order.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.product.deleteMany({
      where: { storeId: testStoreId }
    });
    await prisma.category.deleteMany({
      where: { id: testCategoryId }
    });
    await prisma.store.deleteMany({
      where: { id: testStoreId }
    });
    await prisma.address.deleteMany({
      where: { userId: testUserId }
    });
    const userIds = [testUserId, storeOwnerId].filter(id => id !== undefined);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } }
      });
    }
  });

  describe('POST /api/chat/rooms/:orderId', () => {
    it('deve criar sala de chat com sucesso', async () => {
      const response = await request(app)
        .post(`/api/chat/rooms/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.chatRoom).toBeDefined();
      expect(response.body.data.chatRoom.orderId).toBe(testOrderId);
      expect(response.body.data.chatRoom.client.id).toBe(testUserId);
      expect(response.body.data.chatRoom.store.id).toBe(storeOwnerId);
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .post(`/api/chat/rooms/${testOrderId}`)
        .expect(401);
    });

    it('deve falhar com pedido inexistente', async () => {
      await request(app)
        .post('/api/chat/rooms/pedido-inexistente')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('POST /api/chat/messages', () => {
    it('deve enviar mensagem com sucesso', async () => {
      // Criar sala de chat primeiro
      await request(app)
        .post(`/api/chat/rooms/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const messageData = {
        orderId: testOrderId,
        message: 'Olá! Gostaria de saber sobre meu pedido.',
        messageType: 'TEXT'
      };

      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBeDefined();
      expect(response.body.data.message.message).toBe(messageData.message);
      expect(response.body.data.message.senderType).toBe('CLIENT');
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .post('/api/chat/messages')
        .send({
          orderId: testOrderId,
          message: 'Teste'
        })
        .expect(401);
    });

    it('deve falhar com dados inválidos', async () => {
      await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: 'invalid-id',
          message: ''
        })
        .expect(400);
    });
  });

  describe('GET /api/chat/rooms/:orderId/messages', () => {
    it('deve obter histórico de mensagens com sucesso', async () => {
      // Criar dados específicos para este teste
      const testAddress = await prisma.address.create({
        data: {
          street: 'Rua Test Messages',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
          userId: testUserId
        }
      });

      const testOrder = await prisma.order.create({
        data: {
          userId: testUserId,
          storeId: testStoreId,
          addressId: testAddress.id,
          status: 'PENDING',
          total: 25.0,
          deliveryFee: 5.0,
          subtotal: 20.0,
          paymentMethod: 'credit_card',
          paymentStatus: 'pending'
        }
      });

      // Criar sala de chat primeiro
      await request(app)
        .post(`/api/chat/rooms/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .get(`/api/chat/rooms/${testOrder.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chatHistory).toBeDefined();
      expect(response.body.data.chatHistory.messages).toBeDefined();
      expect(Array.isArray(response.body.data.chatHistory.messages)).toBe(true);

      // Limpar dados específicos
      await prisma.order.delete({ where: { id: testOrder.id } });
      await prisma.address.delete({ where: { id: testAddress.id } });
      
      // Pequeno delay para evitar interferência entre testes
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .get(`/api/chat/rooms/${testOrderId}/messages`)
        .expect(401);
    });

    it('deve falhar com pedido inexistente', async () => {
      await request(app)
        .get('/api/chat/rooms/pedido-inexistente/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('PUT /api/chat/rooms/:orderId/read', () => {
    it('deve marcar mensagens como lidas com sucesso', async () => {
      // Criar sala de chat primeiro
      await request(app)
        .post(`/api/chat/rooms/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .put(`/api/chat/rooms/${testOrderId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Mensagens marcadas como lidas');
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .put(`/api/chat/rooms/${testOrderId}/read`)
        .expect(401);
    });
  });

  describe('GET /api/chat/rooms', () => {
    beforeEach(async () => {
      // Limpar salas de chat existentes para este teste específico
      await prisma.chatMessage.deleteMany();
      await prisma.chatRoom.deleteMany();
    });

    it('deve listar salas de chat do usuário', async () => {
      // Criar dados específicos para este teste
      const testAddress = await prisma.address.create({
        data: {
          street: 'Rua Test List',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
          userId: testUserId
        }
      });

      const testOrder = await prisma.order.create({
        data: {
          userId: testUserId,
          storeId: testStoreId,
          addressId: testAddress.id,
          status: 'PENDING',
          total: 25.0,
          deliveryFee: 5.0,
          subtotal: 20.0,
          paymentMethod: 'credit_card',
          paymentStatus: 'pending'
        }
      });

      // Criar sala de chat primeiro
      await request(app)
        .post(`/api/chat/rooms/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chatRooms).toBeDefined();
      expect(response.body.data.chatRooms.rooms).toBeDefined();
      expect(Array.isArray(response.body.data.chatRooms.rooms)).toBe(true);

      // Limpar dados específicos
      await prisma.order.delete({ where: { id: testOrder.id } });
      await prisma.address.delete({ where: { id: testAddress.id } });
      
      // Pequeno delay para evitar interferência entre testes
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .get('/api/chat/rooms')
        .expect(401);
    });
  });

  describe('GET /api/chat/rooms/:orderId', () => {
    it('deve obter sala de chat específica', async () => {
      // Criar dados específicos para este teste
      const testAddress = await prisma.address.create({
        data: {
          street: 'Rua Test Specific',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
          userId: testUserId
        }
      });

      const testOrder = await prisma.order.create({
        data: {
          userId: testUserId,
          storeId: testStoreId,
          addressId: testAddress.id,
          status: 'PENDING',
          total: 25.0,
          deliveryFee: 5.0,
          subtotal: 20.0,
          paymentMethod: 'credit_card',
          paymentStatus: 'pending'
        }
      });

      // Criar sala de chat primeiro
      await request(app)
        .post(`/api/chat/rooms/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .get(`/api/chat/rooms/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chatRoom).toBeDefined();
      expect(response.body.data.chatRoom.orderId).toBe(testOrder.id);

      // Limpar dados específicos
      await prisma.order.delete({ where: { id: testOrder.id } });
      await prisma.address.delete({ where: { id: testAddress.id } });
      
      // Pequeno delay para evitar interferência entre testes
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .get(`/api/chat/rooms/${testOrderId}`)
        .expect(401);
    });
  });

  describe('GET /api/chat/stats', () => {
    it('deve obter estatísticas de chat', async () => {
      const response = await request(app)
        .get('/api/chat/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalMessages).toBeDefined();
      expect(response.body.data.stats.unreadMessages).toBeDefined();
      expect(response.body.data.stats.activeRooms).toBeDefined();
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .get('/api/chat/stats')
        .expect(401);
    });
  });

  describe('PUT /api/chat/rooms/:orderId/close', () => {
    it('deve fechar sala de chat com sucesso (apenas loja)', async () => {
      // Criar sala de chat primeiro
      await request(app)
        .post(`/api/chat/rooms/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .put(`/api/chat/rooms/${testOrderId}/close`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sala de chat fechada com sucesso');
    });

    it('deve falhar para cliente tentando fechar sala', async () => {
      await request(app)
        .put(`/api/chat/rooms/${testOrderId}/close`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .put(`/api/chat/rooms/${testOrderId}/close`)
        .expect(401);
    });
  });

  describe('POST /api/chat/system-messages', () => {
    it('deve enviar mensagem do sistema com sucesso (apenas loja)', async () => {
      // Criar sala de chat primeiro
      await request(app)
        .post(`/api/chat/rooms/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const systemMessageData = {
        orderId: testOrderId,
        type: 'ORDER_UPDATED',
        message: 'Seu pedido está sendo preparado!',
        metadata: {
          status: 'PREPARING'
        }
      };

      const response = await request(app)
        .post('/api/chat/system-messages')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send(systemMessageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBeDefined();
      expect(response.body.data.message.message).toBe(systemMessageData.message);
      expect(response.body.data.message.messageType).toBe('SYSTEM');
    });

    it('deve falhar para cliente tentando enviar mensagem do sistema', async () => {
      await request(app)
        .post('/api/chat/system-messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrderId,
          type: 'ORDER_UPDATED',
          message: 'Teste'
        })
        .expect(403);
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .post('/api/chat/system-messages')
        .send({
          orderId: testOrderId,
          type: 'ORDER_UPDATED',
          message: 'Teste'
        })
        .expect(401);
    });
  });
});
