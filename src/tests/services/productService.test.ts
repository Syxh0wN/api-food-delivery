import { ProductService } from "../../services/productService";
import { CreateProductInput } from "../../types/product";
import { prisma } from "../setup";

describe("ProductService", () => {
  let productService: ProductService;
  let testUserId: string;
  let testStoreId: string;
  let testCategoryId: string;

  beforeEach(async () => {
    productService = new ProductService();
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

  const createTestData = async () => {
    const testUser = await prisma.user.create({
      data: {
        email: "teste@produto.com",
        password: "hashedpassword",
        name: "Usuário Teste",
        role: "STORE_OWNER",
      },
    });
    testUserId = testUser.id;

    const testStore = await prisma.store.create({
      data: {
        name: "Loja Teste",
        description: "Loja para testes",
        phone: "11999999999",
        email: "teste@produto.com",
        address: JSON.stringify({
          street: "Rua Teste",
          number: "123",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234567",
        }),
        deliveryRadius: 5,
        estimatedDeliveryTime: 30,
        minimumOrderValue: 20,
        ownerId: testUserId,
      },
    });
    testStoreId = testStore.id;

    const testCategory = await prisma.category.create({
      data: {
        name: "Categoria Teste",
        description: "Categoria para testes",
      },
    });
    testCategoryId = testCategory.id;
  };

  describe("createProduct", () => {
    it("deve criar produto com sucesso", async () => {
      await createTestData();
      const productData: CreateProductInput = {
        name: "Produto Teste",
        description: "Produto para testes com descrição longa",
        price: 25.9,
        categoryId: testCategoryId,
        isAvailable: true,
        preparationTime: 20,
        ingredients: ["Ingrediente 1", "Ingrediente 2"],
        allergens: ["Glúten"],
        isVegetarian: true,
      };

      const product = await productService.createProduct(
        testStoreId,
        testUserId,
        productData
      );

      expect(product).toBeDefined();
      expect(product.name).toBe(productData.name);
      expect(product.description).toBe(productData.description);
      expect(product.price).toBe(productData.price);
      expect(product.categoryId).toBe(productData.categoryId);
      expect(product.storeId).toBe(testStoreId);
      expect(product.isAvailable).toBe(productData.isAvailable);
      expect(product.preparationTime).toBe(productData.preparationTime);
      expect(product.ingredients).toEqual(productData.ingredients);
      expect(product.allergens).toEqual(productData.allergens);
      expect(product.isVegetarian).toBe(productData.isVegetarian);
    });

    it("deve falhar ao criar produto para loja inexistente", async () => {
      await createTestData();
      const productData: CreateProductInput = {
        name: "Produto Teste",
        description: "Produto para testes com descrição longa",
        price: 25.9,
        categoryId: testCategoryId,
      };

      await expect(
        productService.createProduct(
          "loja-inexistente",
          testUserId,
          productData
        )
      ).rejects.toThrow("Loja não encontrada ou não pertence ao usuário");
    });

    it("deve falhar ao criar produto para categoria inexistente", async () => {
      await createTestData();
      const productData: CreateProductInput = {
        name: "Produto Teste",
        description: "Produto para testes com descrição longa",
        price: 25.9,
        categoryId: "categoria-inexistente",
      };

      await expect(
        productService.createProduct(testStoreId, testUserId, productData)
      ).rejects.toThrow("Categoria não encontrada");
    });
  });

  describe("getProductById", () => {
    it("deve retornar produto quando encontrado", async () => {
      await createTestData();
      const productData: CreateProductInput = {
        name: "Produto Teste",
        description: "Produto para testes com descrição longa",
        price: 25.9,
        categoryId: testCategoryId,
      };

      const createdProduct = await productService.createProduct(
        testStoreId,
        testUserId,
        productData
      );
      const foundProduct = await productService.getProductById(
        createdProduct.id
      );

      expect(foundProduct).toBeDefined();
      expect(foundProduct?.id).toBe(createdProduct.id);
      expect(foundProduct?.name).toBe(productData.name);
    });

    it("deve retornar null quando produto não encontrado", async () => {
      await createTestData();
      const product = await productService.getProductById(
        "produto-inexistente"
      );
      expect(product).toBeNull();
    });
  });

  describe("getProductsByStore", () => {
    it("deve retornar produtos da loja", async () => {
      await createTestData();
      const productData: CreateProductInput = {
        name: "Produto Teste",
        description: "Produto para testes com descrição longa",
        price: 25.9,
        categoryId: testCategoryId,
        isAvailable: true,
      };

      await productService.createProduct(testStoreId, testUserId, productData);
      const products = await productService.getProductsByStore(testStoreId);

      expect(products).toHaveLength(1);
      expect(products[0]?.name).toBe(productData.name);
      expect(products[0]?.storeId).toBe(testStoreId);
    });

    it("deve retornar apenas produtos disponíveis", async () => {
      await createTestData();
      // Criar produto disponível
      const availableProduct: CreateProductInput = {
        name: "Produto Disponível",
        description: "Produto disponível para testes",
        price: 25.9,
        categoryId: testCategoryId,
        isAvailable: true,
      };

      // Criar produto indisponível
      const unavailableProduct: CreateProductInput = {
        name: "Produto Indisponível",
        description: "Produto indisponível para testes",
        price: 15.9,
        categoryId: testCategoryId,
        isAvailable: false,
      };

      await productService.createProduct(
        testStoreId,
        testUserId,
        availableProduct
      );
      await productService.createProduct(
        testStoreId,
        testUserId,
        unavailableProduct
      );

      const products = await productService.getProductsByStore(testStoreId);

      expect(products).toHaveLength(1);
      expect(products[0]?.name).toBe("Produto Disponível");
    });
  });

  describe("updateProduct", () => {
    it("deve atualizar produto com sucesso", async () => {
      await createTestData();
      const productData: CreateProductInput = {
        name: "Produto Teste",
        description: "Produto para testes com descrição longa",
        price: 25.9,
        categoryId: testCategoryId,
      };

      const createdProduct = await productService.createProduct(
        testStoreId,
        testUserId,
        productData
      );

      const updateData = {
        name: "Produto Atualizado",
        price: 30.0,
        isAvailable: false,
      };

      const updatedProduct = await productService.updateProduct(
        createdProduct.id,
        testStoreId,
        testUserId,
        updateData
      );

      expect(updatedProduct.name).toBe(updateData.name);
      expect(updatedProduct.price).toBe(updateData.price);
      expect(updatedProduct.isAvailable).toBe(updateData.isAvailable);
      expect(updatedProduct.id).toBe(createdProduct.id);
    });

    it("deve falhar ao atualizar produto de outro usuário", async () => {
      await createTestData();
      const productData: CreateProductInput = {
        name: "Produto Teste",
        description: "Produto para testes com descrição longa",
        price: 25.9,
        categoryId: testCategoryId,
      };

      const createdProduct = await productService.createProduct(
        testStoreId,
        testUserId,
        productData
      );

      const updateData = {
        name: "Produto Atualizado",
      };

      await expect(
        productService.updateProduct(
          createdProduct.id,
          testStoreId,
          "outro-usuario-id",
          updateData
        )
      ).rejects.toThrow("Produto não encontrado ou não pertence ao usuário");
    });
  });

  describe("deleteProduct", () => {
    it("deve excluir produto com sucesso", async () => {
      await createTestData();
      const productData: CreateProductInput = {
        name: "Produto Teste",
        description: "Produto para testes com descrição longa",
        price: 25.9,
        categoryId: testCategoryId,
      };

      const createdProduct = await productService.createProduct(
        testStoreId,
        testUserId,
        productData
      );

      await expect(
        productService.deleteProduct(createdProduct.id, testStoreId, testUserId)
      ).resolves.not.toThrow();

      // Verificar se foi excluído
      const deletedProduct = await productService.getProductById(
        createdProduct.id
      );
      expect(deletedProduct).toBeNull();
    });

    it("deve falhar ao excluir produto de outro usuário", async () => {
      await createTestData();
      const productData: CreateProductInput = {
        name: "Produto Teste",
        description: "Produto para testes com descrição longa",
        price: 25.9,
        categoryId: testCategoryId,
      };

      const createdProduct = await productService.createProduct(
        testStoreId,
        testUserId,
        productData
      );

      await expect(
        productService.deleteProduct(
          createdProduct.id,
          testStoreId,
          "outro-usuario-id"
        )
      ).rejects.toThrow("Produto não encontrado ou não pertence ao usuário");
    });
  });

  describe("toggleProductAvailability", () => {
    it("deve alternar disponibilidade do produto", async () => {
      await createTestData();
      const productData: CreateProductInput = {
        name: "Produto Teste",
        description: "Produto para testes com descrição longa",
        price: 25.9,
        categoryId: testCategoryId,
        isAvailable: true,
      };

      const createdProduct = await productService.createProduct(
        testStoreId,
        testUserId,
        productData
      );

      // Alternar para indisponível
      const updatedProduct = await productService.toggleProductAvailability(
        createdProduct.id,
        testStoreId,
        testUserId
      );

      expect(updatedProduct.isAvailable).toBe(false);

      // Alternar novamente para disponível
      const updatedProduct2 = await productService.toggleProductAvailability(
        createdProduct.id,
        testStoreId,
        testUserId
      );

      expect(updatedProduct2.isAvailable).toBe(true);
    });
  afterAll(async () => {
    await prisma.$disconnect();
  });
});
