import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
    }
  }
});

beforeAll(async () => {
  try {
    await prisma.$connect();
  } catch (error) {
    console.warn('Database connection failed, running tests without database');
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.warn('Database disconnection failed');
  }
});

beforeEach(async () => {
  try {
    await prisma.user.deleteMany();
    await prisma.address.deleteMany();
    await prisma.store.deleteMany();
    await prisma.category.deleteMany();
    await prisma.product.deleteMany();
    await prisma.order.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.review.deleteMany();
  } catch (error) {
    console.warn('Database cleanup failed');
  }
});

export { prisma };
