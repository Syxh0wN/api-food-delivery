import { UserService } from "../../services/userService";
import { prisma } from "../setup";

describe("UserService", () => {
  let userService: UserService;
  let userId: string;
  let testEmail: string;

  beforeEach(async () => {
    userService = new UserService();
    // Limpar dados antes de cada teste em ordem correta
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.review.deleteMany();
    await prisma.product.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.store.deleteMany();
    await prisma.category.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();
  });

  const createTestUser = async () => {
    testEmail = `test${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashedpassword",
        name: "Test User",
        phone: "123456789",
      },
    });
    userId = user.id;
    return user;
  };

  describe("getProfile", () => {
    it("should get user profile", async () => {
      await createTestUser();
      const profile = await userService.getProfile(userId);

      expect(profile.id).toBe(userId);
      expect(profile.email).toBe(testEmail);
      expect(profile.name).toBe("Test User");
      expect(profile.phone).toBe("123456789");
    });

    it("should throw error for non-existent user", async () => {
      await expect(userService.getProfile("non-existent-id")).rejects.toThrow(
        "Usuário não encontrado"
      );
    });
  });

  describe("updateProfile", () => {
    it("should update user profile", async () => {
      await createTestUser();
      const updateData = {
        name: "Updated Name",
        phone: "987654321",
      };

      const updatedUser = await userService.updateProfile(userId, updateData);

      expect(updatedUser.name).toBe("Updated Name");
      expect(updatedUser.phone).toBe("987654321");
      expect(updatedUser.email).toBe(testEmail);
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        userService.updateProfile("non-existent-id", { name: "New Name" })
      ).rejects.toThrow("Usuário não encontrado");
    });
  });

  describe("address management", () => {
    it("should create address", async () => {
      await createTestUser();
      const addressData = {
        street: "Rua Teste",
        number: "123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234567",
        isDefault: true,
      };

      const address = await userService.createAddress(userId, addressData);

      expect(address.street).toBe("Rua Teste");
      expect(address.number).toBe("123");
      expect(address.isDefault).toBe(true);
    });

    it("should get user addresses", async () => {
      await createTestUser();
      await userService.createAddress(userId, {
        street: "Rua Teste 1",
        number: "123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234567",
      });

      await userService.createAddress(userId, {
        street: "Rua Teste 2",
        number: "456",
        neighborhood: "Vila Nova",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234568",
        isDefault: true,
      });

      const addresses = await userService.getUserAddresses(userId);

      expect(addresses).toHaveLength(2);
      expect(addresses[0]?.isDefault).toBe(true);
    });

    it("should update address", async () => {
      await createTestUser();
      const address = await userService.createAddress(userId, {
        street: "Rua Teste",
        number: "123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234567",
      });

      const updatedAddress = await userService.updateAddress(
        userId,
        address.id,
        {
          street: "Rua Atualizada",
          number: "456",
        }
      );

      expect(updatedAddress.street).toBe("Rua Atualizada");
      expect(updatedAddress.number).toBe("456");
    });

    it("should delete address", async () => {
      await createTestUser();
      const address = await userService.createAddress(userId, {
        street: "Rua Teste",
        number: "123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234567",
      });

      await userService.deleteAddress(userId, address.id);

      const addresses = await userService.getUserAddresses(userId);
      expect(addresses).toHaveLength(0);
    });

    it("should set default address", async () => {
      await createTestUser();
      const address1 = await userService.createAddress(userId, {
        street: "Rua Teste 1",
        number: "123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234567",
        isDefault: true,
      });

      const address2 = await userService.createAddress(userId, {
        street: "Rua Teste 2",
        number: "456",
        neighborhood: "Vila Nova",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234568",
      });

      await userService.setDefaultAddress(userId, address2.id);

      const addresses = await userService.getUserAddresses(userId);
      const defaultAddress = addresses.find((addr) => addr.isDefault);

      expect(defaultAddress?.id).toBe(address2.id);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
