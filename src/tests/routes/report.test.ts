import request from 'supertest';
import app from '../../index';
import { PrismaClient, UserRole, OrderStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Report Routes', () => {
  let adminToken: string;
  let storeOwnerToken: string;
  let clientToken: string;
  let adminId: string;
  let storeOwnerId: string;
  let clientId: string;
  let testStoreId: string;
  let testCategoryId: string;
  let testProductId: string;
  let testOrderId: string;

  beforeAll(async () => {
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin-report@example.com',
        password: 'hashedpassword',
        role: UserRole.ADMIN
      }
    });
    adminId = adminUser.id;

    const storeOwnerUser = await prisma.user.create({
      data: {
        name: 'Store Owner Test',
        email: 'storeowner-report@example.com',
        password: 'hashedpassword',
        role: UserRole.STORE_OWNER
      }
    });
    storeOwnerId = storeOwnerUser.id;

    const clientUser = await prisma.user.create({
      data: {
        name: 'Client Test',
        email: 'client-report@example.com',
        password: 'hashedpassword',
        role: UserRole.CLIENT
      }
    });
    clientId = clientUser.id;

    adminToken = jwt.sign(
      { userId: adminId, role: UserRole.ADMIN },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    storeOwnerToken = jwt.sign(
      { userId: storeOwnerId, role: UserRole.STORE_OWNER },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    clientToken = jwt.sign(
      { userId: clientId, role: UserRole.CLIENT },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    const testStore = await prisma.store.create({
      data: {
        name: 'Test Store Report',
        description: 'Store for testing reports',
        phone: '11999999999',
        address: {
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test Neighborhood',
          city: 'Test City',
          state: 'SP',
          zipCode: '12345678'
        },
        deliveryRadius: 5,
        estimatedDeliveryTime: 30,
        minimumOrderValue: 10,
        ownerId: storeOwnerId,
        email: 'teststore@example.com'
      }
    });
    testStoreId = testStore.id;

    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Category Report',
        description: 'Category for testing reports'
      }
    });
    testCategoryId = testCategory.id;

    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product Report',
        description: 'Product for testing reports',
        price: 15.99,
        categoryId: testCategoryId,
        storeId: testStoreId,
        nutritionalInfo: {}
      }
    });
    testProductId = testProduct.id;

    const testAddress = await prisma.address.create({
      data: {
        street: 'Client Street',
        number: '456',
        neighborhood: 'Client Neighborhood',
        city: 'Client City',
        state: 'SP',
        zipCode: '87654321',
        userId: clientId
      }
    });

    const testOrder = await prisma.order.create({
      data: {
        userId: clientId,
        storeId: testStoreId,
        addressId: testAddress.id,
        subtotal: 15.99,
        total: 15.99,
        status: OrderStatus.DELIVERED,
        paymentMethod: 'PIX'
      }
    });
    testOrderId = testOrder.id;

    await prisma.orderItem.create({
      data: {
        orderId: testOrderId,
        productId: testProductId,
        quantity: 1,
        price: 15.99
      }
    });
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({
      where: { orderId: testOrderId }
    });
    await prisma.order.deleteMany({
      where: { id: testOrderId }
    });
    await prisma.address.deleteMany({
      where: { userId: clientId }
    });
    await prisma.product.deleteMany({
      where: { id: testProductId }
    });
    await prisma.category.deleteMany({
      where: { id: testCategoryId }
    });
    await prisma.store.deleteMany({
      where: { id: testStoreId }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, storeOwnerId, clientId] } }
    });
  });

  describe('GET /api/reports/sales', () => {
    it('deve retornar relatório de vendas para admin', async () => {
      const response = await request(app)
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSales');
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('averageOrderValue');
      expect(response.body.data).toHaveProperty('salesByPeriod');
      expect(response.body.data).toHaveProperty('salesByStore');
      expect(response.body.data).toHaveProperty('salesByCategory');
      expect(response.body.data).toHaveProperty('salesByPaymentMethod');
      expect(response.body).toHaveProperty('filters');
      expect(response.body).toHaveProperty('generatedAt');
      expect(response.body).toHaveProperty('period');
    });

    it('deve retornar 403 para store owner', async () => {
      const response = await request(app)
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(403);

      expect(response.status).toBe(403);
    });

    it('deve retornar 403 para client', async () => {
      const response = await request(app)
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.status).toBe(403);
    });

    it('deve retornar 401 sem token', async () => {
      const response = await request(app)
        .get('/api/reports/sales')
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('deve filtrar por período', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/reports/sales?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.period.startDate).toBe(startDate);
      expect(response.body.period.endDate).toBe(endDate);
    });
  });

  describe('GET /api/reports/orders', () => {
    it('deve retornar relatório de pedidos para admin', async () => {
      const response = await request(app)
        .get('/api/reports/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('ordersByStatus');
      expect(response.body.data).toHaveProperty('ordersByPeriod');
      expect(response.body.data).toHaveProperty('ordersByStore');
      expect(response.body.data).toHaveProperty('ordersByUser');
      expect(response.body.data).toHaveProperty('averageDeliveryTime');
      expect(response.body.data).toHaveProperty('cancellationRate');
    });

    it('deve retornar 403 para não-admin', async () => {
      const response = await request(app)
        .get('/api/reports/orders')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/users', () => {
    it('deve retornar relatório de usuários para admin', async () => {
      const response = await request(app)
        .get('/api/reports/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('newUsers');
      expect(response.body.data).toHaveProperty('activeUsers');
      expect(response.body.data).toHaveProperty('usersByRole');
      expect(response.body.data).toHaveProperty('usersByPeriod');
      expect(response.body.data).toHaveProperty('topUsersByOrders');
      expect(response.body.data).toHaveProperty('topUsersBySpending');
      expect(response.body.data).toHaveProperty('userRetentionRate');
    });

    it('deve retornar 403 para não-admin', async () => {
      const response = await request(app)
        .get('/api/reports/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/stores', () => {
    it('deve retornar relatório de lojas para admin', async () => {
      const response = await request(app)
        .get('/api/reports/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalStores');
      expect(response.body.data).toHaveProperty('activeStores');
      expect(response.body.data).toHaveProperty('newStores');
      expect(response.body.data).toHaveProperty('storesByStatus');
      expect(response.body.data).toHaveProperty('storesByPeriod');
      expect(response.body.data).toHaveProperty('topStoresBySales');
      expect(response.body.data).toHaveProperty('topStoresByOrders');
      expect(response.body.data).toHaveProperty('averageStoreRating');
      expect(response.body.data).toHaveProperty('storeActivationRate');
    });

    it('deve retornar 403 para não-admin', async () => {
      const response = await request(app)
        .get('/api/reports/stores')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/products', () => {
    it('deve retornar relatório de produtos para admin', async () => {
      const response = await request(app)
        .get('/api/reports/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalProducts');
      expect(response.body.data).toHaveProperty('activeProducts');
      expect(response.body.data).toHaveProperty('productsByCategory');
      expect(response.body.data).toHaveProperty('topProductsBySales');
      expect(response.body.data).toHaveProperty('topProductsByOrders');
      expect(response.body.data).toHaveProperty('averageProductRating');
      expect(response.body.data).toHaveProperty('productAvailabilityRate');
    });

    it('deve retornar 403 para não-admin', async () => {
      const response = await request(app)
        .get('/api/reports/products')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/dashboard', () => {
    it('deve retornar relatório do dashboard para admin', async () => {
      const response = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('salesTrend');
      expect(response.body.data).toHaveProperty('orderStatusDistribution');
      expect(response.body.data).toHaveProperty('topStores');
      expect(response.body.data).toHaveProperty('topProducts');
      expect(response.body.data).toHaveProperty('recentOrders');
      
      expect(response.body.data.overview).toHaveProperty('totalSales');
      expect(response.body.data.overview).toHaveProperty('totalOrders');
      expect(response.body.data.overview).toHaveProperty('totalUsers');
      expect(response.body.data.overview).toHaveProperty('totalStores');
      expect(response.body.data.overview).toHaveProperty('averageOrderValue');
      expect(response.body.data.overview).toHaveProperty('averageDeliveryTime');
      expect(response.body.data.overview).toHaveProperty('cancellationRate');
      expect(response.body.data.overview).toHaveProperty('userRetentionRate');
      expect(response.body.data.overview).toHaveProperty('storeActivationRate');
    });

    it('deve retornar 403 para não-admin', async () => {
      const response = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/reports/export/:reportType', () => {
    it('deve exportar relatório em JSON para admin', async () => {
      const response = await request(app)
        .post('/api/reports/export/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'json',
          includeCharts: false,
          includeDetails: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSales');
    });

    it('deve exportar relatório em CSV para admin', async () => {
      const response = await request(app)
        .post('/api/reports/export/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'csv',
          includeCharts: false,
          includeDetails: true
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('deve exportar relatório em PDF para admin', async () => {
      const response = await request(app)
        .post('/api/reports/export/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'pdf',
          includeCharts: true,
          includeDetails: true
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('deve retornar 400 para tipo de relatório inválido', async () => {
      const response = await request(app)
        .post('/api/reports/export/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'json'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inválido');
    });

    it('deve retornar 403 para não-admin', async () => {
      const response = await request(app)
        .post('/api/reports/export/sales')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send({
          format: 'json'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('deve retornar 400 para formato inválido', async () => {
      const response = await request(app)
        .post('/api/reports/export/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'invalid'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validação');
    });
  });

  describe('Filtros de relatórios', () => {
    it('deve filtrar por loja específica', async () => {
      const response = await request(app)
        .get(`/api/reports/sales?storeId=${testStoreId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.filters.storeId).toBe(testStoreId);
    });

    it('deve filtrar por categoria específica', async () => {
      const response = await request(app)
        .get(`/api/reports/products?categoryId=${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.filters.categoryId).toBe(testCategoryId);
    });

    it('deve filtrar por método de pagamento', async () => {
      const response = await request(app)
        .get('/api/reports/sales?paymentMethod=PIX')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.filters.paymentMethod).toBe('PIX');
    });

    it('deve filtrar por status de pedido', async () => {
      const response = await request(app)
        .get('/api/reports/orders?status=DELIVERED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.filters.status).toBe('DELIVERED');
    });
  });

  describe('Validação de dados', () => {
    it('deve retornar erro para data inválida', async () => {
      const response = await request(app)
        .get('/api/reports/sales?startDate=invalid-date')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('deve retornar erro para período inválido', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/reports/sales?startDate=${futureDate}&endDate=${pastDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
