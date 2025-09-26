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

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    // Silent fail
  }
});


export { prisma };
