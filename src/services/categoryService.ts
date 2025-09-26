import { prisma } from '../config/database';
import { CreateCategoryInput, UpdateCategoryInput, CategoryResponse } from '../types/product';

export class CategoryService {
  async createCategory(data: CreateCategoryInput): Promise<CategoryResponse> {
    const existingCategory = await prisma.category.findUnique({
      where: { name: data.name }
    });

    if (existingCategory) {
      throw new Error('Categoria com este nome já existe');
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description || null
      }
    });

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };
  }

  async getAllCategories(): Promise<CategoryResponse[]> {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));
  }

  async getCategoryById(categoryId: string): Promise<CategoryResponse | null> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return null;
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };
  }

  async updateCategory(categoryId: string, data: UpdateCategoryInput): Promise<CategoryResponse> {
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      throw new Error('Categoria não encontrada');
    }

    // Se o nome foi alterado, verificar se já existe
    if (data.name && data.name !== existingCategory.name) {
      const categoryWithSameName = await prisma.category.findUnique({
        where: { name: data.name }
      });

      if (categoryWithSameName) {
        throw new Error('Categoria com este nome já existe');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateData
    });

    return {
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt
    };
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        products: true
      }
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    if (category.products.length > 0) {
      throw new Error('Não é possível excluir categoria que possui produtos');
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });
  }
}
