import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:password@localhost:5432/myfood_db",
    },
  },
});

beforeAll(async () => {
  try {
    await prisma.$connect();
  } catch (error) {
    throw error;
  }
});

beforeEach(async () => {
  // Limpar dados de chat apenas se não for um teste de chat
  if (!expect.getState().testPath?.includes('chat.test.ts')) {
    await prisma.chatMessage.deleteMany();
    await prisma.chatRoom.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
  }
  
  // Sempre limpar outros dados
  await prisma.couponUsage.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.productVariation.deleteMany();
  await prisma.review.deleteMany();
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
    if (global.gc) {
      global.gc();
    }
  } catch (error) {
  }
});

export { prisma };
