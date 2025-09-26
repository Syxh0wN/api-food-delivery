import { prisma } from "../config/database";
import {
  CreateProductInput,
  UpdateProductInput,
  ProductResponse,
  ProductListResponse,
} from "../types/product";

export class ProductService {
  async createProduct(
    storeId: string,
    ownerId: string,
    data: CreateProductInput
  ): Promise<ProductResponse> {
    // Verificar se a loja pertence ao usuário
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: ownerId,
      },
    });

    if (!store) {
      throw new Error("Loja não encontrada ou não pertence ao usuário");
    }

    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        storeId: storeId,
        isAvailable: data.isAvailable ?? true,
        preparationTime: data.preparationTime || null,
        ingredients: data.ingredients || [],
        allergens: data.allergens || [],
        images: data.images || [],
        isVegetarian: data.isVegetarian || false,
        isVegan: data.isVegan || false,
        isGlutenFree: data.isGlutenFree || false,
        nutritionalInfo: data.nutritionalInfo || {},
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            isOpen: true,
          },
        },
      },
    });

    return {
      ...product,
      price: Number(product.price),
    } as ProductResponse;
  }

  async getProductById(productId: string): Promise<ProductResponse | null> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            isOpen: true,
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    return {
      ...product,
      price: Number(product.price),
      averageRating: product.averageRating,
      totalReviews: product.totalReviews,
    } as ProductResponse;
  }

  async getProductsByStore(storeId: string): Promise<ProductListResponse[]> {
    const products = await prisma.product.findMany({
      where: {
        storeId,
        isAvailable: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            isOpen: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      categoryId: product.categoryId,
      storeId: product.storeId,
      isAvailable: product.isAvailable,
      preparationTime: product.preparationTime,
      images: product.images,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews,
      category: product.category,
      store: product.store,
    }));
  }

  async getAllProducts(): Promise<ProductListResponse[]> {
    const products = await prisma.product.findMany({
      where: {
        isAvailable: true,
        store: {
          isOpen: true,
          isActive: true,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            isOpen: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      categoryId: product.categoryId,
      storeId: product.storeId,
      isAvailable: product.isAvailable,
      preparationTime: product.preparationTime,
      images: product.images,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews,
      category: product.category,
      store: product.store,
    }));
  }

  async getProductsByCategory(
    categoryId: string
  ): Promise<ProductListResponse[]> {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        isAvailable: true,
        store: {
          isOpen: true,
          isActive: true,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            isOpen: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      categoryId: product.categoryId,
      storeId: product.storeId,
      isAvailable: product.isAvailable,
      preparationTime: product.preparationTime,
      images: product.images,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews,
      category: product.category,
      store: product.store,
    }));
  }

  async updateProduct(
    productId: string,
    storeId: string,
    ownerId: string,
    data: UpdateProductInput
  ): Promise<ProductResponse> {
    // Verificar se o produto pertence à loja do usuário
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: storeId,
        store: {
          ownerId: ownerId,
        },
      },
    });

    if (!existingProduct) {
      throw new Error("Produto não encontrado ou não pertence ao usuário");
    }

    // Se categoria foi alterada, verificar se existe
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error("Categoria não encontrada");
      }
    }

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.isAvailable !== undefined)
      updateData.isAvailable = data.isAvailable;
    if (data.preparationTime !== undefined)
      updateData.preparationTime = data.preparationTime;
    if (data.ingredients !== undefined)
      updateData.ingredients = data.ingredients;
    if (data.allergens !== undefined) updateData.allergens = data.allergens;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.isVegetarian !== undefined)
      updateData.isVegetarian = data.isVegetarian;
    if (data.isVegan !== undefined) updateData.isVegan = data.isVegan;
    if (data.isGlutenFree !== undefined)
      updateData.isGlutenFree = data.isGlutenFree;
    if (data.nutritionalInfo !== undefined)
      updateData.nutritionalInfo = data.nutritionalInfo;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            isOpen: true,
          },
        },
      },
    });

    return {
      ...updatedProduct,
      price: Number(updatedProduct.price),
    } as ProductResponse;
  }

  async deleteProduct(
    productId: string,
    storeId: string,
    ownerId: string
  ): Promise<void> {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: storeId,
        store: {
          ownerId: ownerId,
        },
      },
    });

    if (!product) {
      throw new Error("Produto não encontrado ou não pertence ao usuário");
    }

    await prisma.product.delete({
      where: { id: productId },
    });
  }

  async toggleProductAvailability(
    productId: string,
    storeId: string,
    ownerId: string
  ): Promise<ProductResponse> {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: storeId,
        store: {
          ownerId: ownerId,
        },
      },
    });

    if (!product) {
      throw new Error("Produto não encontrado ou não pertence ao usuário");
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isAvailable: !product.isAvailable },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            isOpen: true,
          },
        },
      },
    });

    return {
      ...updatedProduct,
      price: Number(updatedProduct.price),
    } as ProductResponse;
  }
}
