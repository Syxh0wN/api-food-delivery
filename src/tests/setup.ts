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
    console.log("Database connected for tests");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.warn("Database disconnection failed");
  }
});


export { prisma };
