import request from 'supertest';
import app from '../../index';
import { prisma } from '../../config/database';
import { generateToken } from '../../utils/jwt';
import { UserRole, NotificationType, NotificationChannel, NotificationPriority } from '@prisma/client';

describe('Notification Routes', () => {
  let authToken: string;
  let adminToken: string;
  let testUserId: string;
  let adminUserId: string;

  beforeAll(async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test-notification@example.com',
        password: 'hashedpassword',
        name: 'Test Notification User',
        phone: '11999999999',
        role: UserRole.CLIENT
      }
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin-notification@example.com',
        password: 'hashedpassword',
        name: 'Admin Notification User',
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
  });

  afterAll(async () => {
    await prisma.notificationHistory.deleteMany({
      where: { userId: { in: [testUserId, adminUserId] } }
    });
    await prisma.notification.deleteMany({
      where: { userId: { in: [testUserId, adminUserId] } }
    });
    await prisma.notificationPreferences.deleteMany({
      where: { userId: { in: [testUserId, adminUserId] } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, adminUserId] } }
    });
  });

  describe('POST /api/notifications/send', () => {
    it('deve enviar notificação com sucesso (admin)', async () => {
      const notificationData = {
        userId: testUserId,
        type: NotificationType.SYSTEM_ALERT,
        title: 'Teste de Notificação',
        message: 'Esta é uma notificação de teste',
        channels: [NotificationChannel.EMAIL],
        priority: NotificationPriority.NORMAL
      };

      const response = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification).toBeDefined();
      expect(response.body.data.notification.userId).toBe(testUserId);
      expect(response.body.data.notification.title).toBe('Teste de Notificação');
    });

    it('deve falhar para usuário comum', async () => {
      const notificationData = {
        userId: testUserId,
        type: NotificationType.SYSTEM_ALERT,
        title: 'Teste de Notificação',
        message: 'Esta é uma notificação de teste',
        channels: [NotificationChannel.EMAIL]
      };

      const response = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });

    it('deve falhar sem token de autenticação', async () => {
      const notificationData = {
        userId: testUserId,
        type: NotificationType.SYSTEM_ALERT,
        title: 'Teste de Notificação',
        message: 'Esta é uma notificação de teste',
        channels: [NotificationChannel.EMAIL]
      };

      await request(app)
        .post('/api/notifications/send')
        .send(notificationData)
        .expect(401);
    });

    it('deve falhar com dados inválidos', async () => {
      const notificationData = {
        userId: 'invalid-id',
        type: 'INVALID_TYPE',
        title: '',
        message: '',
        channels: []
      };

      const response = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });
  });

  describe('POST /api/notifications/send-bulk', () => {
    it('deve enviar notificação em massa com sucesso (admin)', async () => {
      const notificationData = {
        userIds: [testUserId],
        type: NotificationType.PROMOTION,
        title: 'Promoção Especial',
        message: 'Aproveite nossa promoção especial!',
        channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
        priority: NotificationPriority.HIGH
      };

      const response = await request(app)
        .post('/api/notifications/send-bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toBeDefined();
      expect(response.body.data.notifications.length).toBe(1);
    });

    it('deve falhar para usuário comum', async () => {
      const notificationData = {
        userIds: [testUserId],
        type: NotificationType.PROMOTION,
        title: 'Promoção Especial',
        message: 'Aproveite nossa promoção especial!',
        channels: [NotificationChannel.EMAIL]
      };

      const response = await request(app)
        .post('/api/notifications/send-bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });
  });

  describe('PUT /api/notifications/preferences', () => {
    it('deve atualizar preferências com sucesso', async () => {
      const preferencesData = {
        pushEnabled: true,
        emailEnabled: false,
        smsEnabled: true,
        orderUpdates: true,
        promotions: false,
        systemAlerts: true
      };

      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferencesData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toBeDefined();
      expect(response.body.data.preferences.emailEnabled).toBe(false);
      expect(response.body.data.preferences.smsEnabled).toBe(true);
    });

    it('deve falhar sem token de autenticação', async () => {
      const preferencesData = {
        pushEnabled: true,
        emailEnabled: false
      };

      await request(app)
        .put('/api/notifications/preferences')
        .send(preferencesData)
        .expect(401);
    });
  });

  describe('PUT /api/notifications/fcm-token', () => {
    it('deve atualizar FCM token com sucesso', async () => {
      const tokenData = {
        fcmToken: 'test-fcm-token-12345'
      };

      const response = await request(app)
        .put('/api/notifications/fcm-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tokenData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('FCM Token atualizado com sucesso');
    });

    it('deve falhar com token inválido', async () => {
      const tokenData = {
        fcmToken: ''
      };

      const response = await request(app)
        .put('/api/notifications/fcm-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tokenData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erro de validação');
    });
  });

  describe('GET /api/notifications/history', () => {
    it('deve obter histórico de notificações', async () => {
      const response = await request(app)
        .get('/api/notifications/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.history).toBeDefined();
      expect(Array.isArray(response.body.data.history)).toBe(true);
    });

    it('deve obter histórico com limite personalizado', async () => {
      const response = await request(app)
        .get('/api/notifications/history?limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.history).toBeDefined();
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .get('/api/notifications/history')
        .expect(401);
    });
  });

  describe('GET /api/notifications/preferences', () => {
    it('deve obter preferências de notificação', async () => {
      const response = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toBeDefined();
      expect(response.body.data.preferences.userId).toBe(testUserId);
    });

    it('deve criar preferências padrão se não existirem', async () => {
      // Criar um novo usuário sem preferências
      const newUser = await prisma.user.create({
        data: {
          email: 'new-user-notification@example.com',
          password: 'hashedpassword',
          name: 'New User',
          phone: '11999999999',
          role: UserRole.CLIENT
        }
      });

      const newUserToken = generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      });

      const response = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toBeDefined();
      expect(response.body.data.preferences.pushEnabled).toBe(true);
      expect(response.body.data.preferences.emailEnabled).toBe(true);

      // Limpeza
      await prisma.notificationPreferences.deleteMany({
        where: { userId: newUser.id }
      });
      await prisma.user.deleteMany({
        where: { id: newUser.id }
      });
    });

    it('deve falhar sem token de autenticação', async () => {
      await request(app)
        .get('/api/notifications/preferences')
        .expect(401);
    });
  });
});
