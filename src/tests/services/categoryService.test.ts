import { CategoryService } from "../../services/categoryService";
import { CreateCategoryInput } from "../../types/product";
import { prisma } from "../setup";

describe("CategoryService", () => {
  let categoryService: CategoryService;

  beforeEach(async () => {
    categoryService = new CategoryService();
    const { prisma } = await import("../setup");
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

  describe("createCategory", () => {
    it("deve criar uma categoria com sucesso", async () => {
      const categoryData: CreateCategoryInput = {
        name: "Pizzas",
        description: "Pizzas tradicionais e especiais",
      };

      const category = await categoryService.createCategory(categoryData);

      expect(category).toBeDefined();
      expect(category.name).toBe(categoryData.name);
      expect(category.description).toBe(categoryData.description);
      expect(category.id).toBeDefined();
    });

    it("deve criar categoria sem descrição", async () => {
      const categoryData: CreateCategoryInput = {
        name: "Bebidas",
      };

      const category = await categoryService.createCategory(categoryData);

      expect(category).toBeDefined();
      expect(category.name).toBe(categoryData.name);
      expect(category.description).toBeNull();
    });

    it("deve falhar ao tentar criar categoria com nome duplicado", async () => {
      const categoryData: CreateCategoryInput = {
        name: "Pizzas",
        description: "Pizzas tradicionais",
      };

      // Criar primeira categoria
      await categoryService.createCategory(categoryData);

      // Tentar criar segunda categoria com mesmo nome
      await expect(
        categoryService.createCategory(categoryData)
      ).rejects.toThrow("Categoria com este nome já existe");
    });
  });

  describe("getAllCategories", () => {
    it("deve retornar lista vazia quando não há categorias", async () => {
      const categories = await categoryService.getAllCategories();
      expect(categories).toEqual([]);
    });

    it("deve retornar todas as categorias ordenadas por nome", async () => {
      // Criar categorias
      await categoryService.createCategory({ name: "Zebras" });
      await categoryService.createCategory({ name: "Abacaxis" });
      await categoryService.createCategory({ name: "Maçãs" });

      const categories = await categoryService.getAllCategories();

      expect(categories).toHaveLength(3);
      expect(categories[0]?.name).toBe("Abacaxis");
      expect(categories[1]?.name).toBe("Maçãs");
      expect(categories[2]?.name).toBe("Zebras");
    });
  });

  describe("getCategoryById", () => {
    it("deve retornar categoria quando encontrada", async () => {
      const categoryData: CreateCategoryInput = {
        name: "Pizzas",
        description: "Pizzas tradicionais",
      };

      const createdCategory = await categoryService.createCategory(
        categoryData
      );
      const foundCategory = await categoryService.getCategoryById(
        createdCategory.id
      );

      expect(foundCategory).toBeDefined();
      expect(foundCategory?.id).toBe(createdCategory.id);
      expect(foundCategory?.name).toBe(categoryData.name);
    });

    it("deve retornar null quando categoria não encontrada", async () => {
      const category = await categoryService.getCategoryById(
        "categoria-inexistente"
      );
      expect(category).toBeNull();
    });
  });

  describe("updateCategory", () => {
    it("deve atualizar categoria com sucesso", async () => {
      const categoryData: CreateCategoryInput = {
        name: "Pizzas",
        description: "Pizzas tradicionais",
      };

      const createdCategory = await categoryService.createCategory(
        categoryData
      );

      const updateData = {
        name: "Pizzas Premium",
        description: "Pizzas tradicionais e especiais",
      };

      const updatedCategory = await categoryService.updateCategory(
        createdCategory.id,
        updateData
      );

      expect(updatedCategory.name).toBe(updateData.name);
      expect(updatedCategory.description).toBe(updateData.description);
      expect(updatedCategory.id).toBe(createdCategory.id);
    });

    it("deve falhar ao atualizar categoria inexistente", async () => {
      const updateData = {
        name: "Categoria Nova",
      };

      await expect(
        categoryService.updateCategory("categoria-inexistente", updateData)
      ).rejects.toThrow("Categoria não encontrada");
    });

    it("deve falhar ao tentar atualizar para nome duplicado", async () => {
      // Criar duas categorias
      const category1 = await categoryService.createCategory({
        name: "Categoria 1",
      });
      const category2 = await categoryService.createCategory({
        name: "Categoria 2",
      });

      // Tentar atualizar categoria2 para nome da categoria1
      await expect(
        categoryService.updateCategory(category2.id, { name: "Categoria 1" })
      ).rejects.toThrow("Categoria com este nome já existe");
    });
  });

  describe("deleteCategory", () => {
    it("deve excluir categoria com sucesso", async () => {
      const categoryData: CreateCategoryInput = {
        name: "Pizzas",
        description: "Pizzas tradicionais",
      };

      const createdCategory = await categoryService.createCategory(
        categoryData
      );

      await expect(
        categoryService.deleteCategory(createdCategory.id)
      ).resolves.not.toThrow();

      // Verificar se foi excluída
      const deletedCategory = await categoryService.getCategoryById(
        createdCategory.id
      );
      expect(deletedCategory).toBeNull();
    });

    it("deve falhar ao excluir categoria inexistente", async () => {
      await expect(
        categoryService.deleteCategory("categoria-inexistente")
      ).rejects.toThrow("Categoria não encontrada");
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
