import { prisma } from '../config/database';
import { AddToCartInput, UpdateCartItemInput, CartResponse, CartItemResponse, CartSummaryResponse } from '../types/cart';

export class CartService {
  async getOrCreateCart(userId: string): Promise<CartResponse> {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                isOpen: true
              }
            }
          }
        }
      }
    });

    return this.formatCartResponse(userId, cartItems);
  }

  async addToCart(userId: string, data: AddToCartInput): Promise<CartItemResponse> {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            isOpen: true
          }
        }
      }
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    if (!product.isAvailable) {
      throw new Error('Produto não está disponível');
    }

    if (!product.store.isOpen) {
      throw new Error('Loja está fechada');
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: userId,
        productId: data.productId
      }
    });

    if (existingItem) {
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + data.quantity },
        include: {
          product: {
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                  isOpen: true
                }
              }
            }
          }
        }
      });

      return this.formatCartItemResponse(updatedItem);
    }

    const newItem = await prisma.cartItem.create({
      data: {
        userId: userId,
        productId: data.productId,
        quantity: data.quantity
      },
      include: {
        product: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                isOpen: true
              }
            }
          }
        }
      }
    });

    return this.formatCartItemResponse(newItem);
  }

  async updateCartItem(userId: string, itemId: string, data: UpdateCartItemInput): Promise<CartItemResponse> {
    const item = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId: userId
      }
    });

    if (!item) {
      throw new Error('Item não encontrado no carrinho');
    }

    if (data.quantity <= 0) {
      throw new Error('Quantidade deve ser maior que zero');
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: data.quantity },
      include: {
        product: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                isOpen: true
              }
            }
          }
        }
      }
    });

    return this.formatCartItemResponse(updatedItem);
  }

  async removeFromCart(userId: string, itemId: string): Promise<void> {
    const item = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId: userId
      }
    });

    if (!item) {
      throw new Error('Item não encontrado no carrinho');
    }

    await prisma.cartItem.delete({
      where: { id: itemId }
    });
  }

  async clearCart(userId: string): Promise<void> {
    await prisma.cartItem.deleteMany({
      where: { userId }
    });
  }

  async getCartSummary(userId: string): Promise<CartSummaryResponse> {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            price: true
          }
        }
      }
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = cartItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

    return {
      totalItems,
      totalValue,
      itemsCount: cartItems.length
    };
  }

  private formatCartResponse(userId: string, cartItems: any[]): CartResponse {
    const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const totalValue = cartItems.reduce((sum: number, item: any) => sum + (Number(item.product.price) * item.quantity), 0);

    return {
      id: `cart-${userId}`, // ID virtual baseado no userId
      userId: userId,
      items: cartItems.map((item: any) => this.formatCartItemResponse(item)),
      totalItems,
      totalValue,
      createdAt: cartItems.length > 0 ? cartItems[0].createdAt : new Date(),
      updatedAt: cartItems.length > 0 ? cartItems[cartItems.length - 1].updatedAt : new Date()
    };
  }

  private formatCartItemResponse(item: any): CartItemResponse {
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      product: {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        price: Number(item.product.price),
        images: item.product.images,
        isAvailable: item.product.isAvailable,
        store: item.product.store
      }
    };
  }
}