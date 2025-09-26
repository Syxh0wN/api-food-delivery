import { prisma } from '../config/database';
import { CreateOrderInput, UpdateOrderStatusInput, OrderResponse, OrderListResponse, OrderSummaryResponse } from '../types/order';
import { OrderStatus, NotificationType } from '@prisma/client';
import { sendOrderNotification } from '../controllers/notificationController';

export class OrderService {
  async createOrder(userId: string, data: CreateOrderInput): Promise<OrderResponse> {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      throw new Error('Carrinho vazio');
    }

    const store = await prisma.store.findUnique({
      where: { id: data.storeId }
    });

    if (!store) {
      throw new Error('Loja não encontrada');
    }

    if (!store.isOpen) {
      throw new Error('Loja está fechada');
    }

    const address = await prisma.address.findFirst({
      where: { id: data.addressId, userId: userId }
    });

    if (!address) {
      throw new Error('Endereço não encontrado ou não pertence ao usuário');
    }

    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of cartItems) {
      if (!cartItem.product.isAvailable) {
        throw new Error(`Produto ${cartItem.product.name} não está disponível`);
      }

      const itemTotal = Number(cartItem.product.price) * cartItem.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: Number(cartItem.product.price)
      });
    }

    if (subtotal < store.minimumOrderValue) {
      throw new Error(`Valor mínimo do pedido é R$ ${store.minimumOrderValue}`);
    }

    const deliveryFee = 5.0;
    const total = subtotal + deliveryFee;

    const order = await prisma.order.create({
      data: {
        userId: userId,
        storeId: data.storeId,
        addressId: data.addressId,
        status: 'PENDING',
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total: total,
        paymentMethod: data.paymentMethod,
        notes: data.deliveryInstructions || null,
        items: {
          create: orderItems
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            phone: true,
            isOpen: true
          }
        },
        address: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                images: true
              }
            }
          }
        }
      }
    });

    await prisma.cartItem.deleteMany({
      where: { userId }
    });

    // Enviar notificação de pedido confirmado
    await sendOrderNotification(order.id, NotificationType.ORDER_CONFIRMED, {
      storeName: store.name,
      total: Number(order.total),
      estimatedDeliveryTime: store.estimatedDeliveryTime
    });

    return {
      ...order,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      discount: 0,
      total: Number(order.total),
      deliveryInstructions: order.notes,
      couponCode: null,
      estimatedDeliveryTime: store.estimatedDeliveryTime,
      items: order.items.map(item => ({
        ...item,
        unitPrice: Number(item.price),
        totalPrice: Number(item.price) * item.quantity
      }))
    } as OrderResponse;
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 10): Promise<OrderListResponse> {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              phone: true,
              isOpen: true
            }
          },
          address: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  images: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where: { userId } })
    ]);

    return {
      orders: orders.map(order => ({
        ...order,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        discount: 0,
        total: Number(order.total),
        deliveryInstructions: order.notes,
        couponCode: null,
        estimatedDeliveryTime: 30,
        items: order.items.map(item => ({
          ...item,
          unitPrice: Number(item.price),
          totalPrice: Number(item.price) * item.quantity
        }))
      })) as OrderResponse[],
      total,
      page,
      limit
    };
  }

  async getStoreOrders(storeId: string, userId: string, page: number = 1, limit: number = 10): Promise<OrderListResponse> {
    const store = await prisma.store.findFirst({
      where: { id: storeId, ownerId: userId }
    });

    if (!store) {
      throw new Error('Loja não encontrada ou não pertence ao usuário');
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { storeId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              phone: true,
              isOpen: true
            }
          },
          address: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  images: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where: { storeId } })
    ]);

    return {
      orders: orders.map(order => ({
        ...order,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        discount: 0,
        total: Number(order.total),
        deliveryInstructions: order.notes,
        couponCode: null,
        estimatedDeliveryTime: 30,
        items: order.items.map(item => ({
          ...item,
          unitPrice: Number(item.price),
          totalPrice: Number(item.price) * item.quantity
        }))
      })) as OrderResponse[],
      total,
      page,
      limit
    };
  }

  async getOrderById(orderId: string, userId: string): Promise<OrderResponse> {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId: userId },
          { store: { ownerId: userId } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            phone: true,
            isOpen: true
          }
        },
        address: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                images: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    return {
      ...order,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      discount: 0,
      total: Number(order.total),
      deliveryInstructions: order.notes,
      couponCode: null,
      estimatedDeliveryTime: 30,
      items: order.items.map(item => ({
        ...item,
        unitPrice: Number(item.price),
        totalPrice: Number(item.price) * item.quantity
      }))
    } as OrderResponse;
  }

  async updateOrderStatus(orderId: string, storeId: string, userId: string, data: UpdateOrderStatusInput): Promise<OrderResponse> {
    const store = await prisma.store.findFirst({
      where: { id: storeId, ownerId: userId }
    });

    if (!store) {
      throw new Error('Loja não encontrada ou não pertence ao usuário');
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId: storeId }
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: data.status,
        notes: data.notes || order.notes
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            phone: true,
            isOpen: true
          }
        },
        address: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                images: true
              }
            }
          }
        }
      }
    });

    return {
      ...updatedOrder,
      subtotal: Number(updatedOrder.subtotal),
      deliveryFee: Number(updatedOrder.deliveryFee),
      discount: 0,
      total: Number(updatedOrder.total),
      deliveryInstructions: updatedOrder.notes,
      couponCode: null,
      estimatedDeliveryTime: 30,
      items: updatedOrder.items.map(item => ({
        ...item,
        unitPrice: Number(item.price),
        totalPrice: Number(item.price) * item.quantity
      }))
    } as OrderResponse;
  }

  async cancelOrder(orderId: string, userId: string): Promise<OrderResponse> {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: userId }
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    if (order.status !== 'PENDING') {
      throw new Error('Apenas pedidos pendentes podem ser cancelados');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            phone: true,
            isOpen: true
          }
        },
        address: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                images: true
              }
            }
          }
        }
      }
    });

    return {
      ...updatedOrder,
      subtotal: Number(updatedOrder.subtotal),
      deliveryFee: Number(updatedOrder.deliveryFee),
      discount: 0,
      total: Number(updatedOrder.total),
      deliveryInstructions: updatedOrder.notes,
      couponCode: null,
      estimatedDeliveryTime: 30,
      items: updatedOrder.items.map(item => ({
        ...item,
        unitPrice: Number(item.price),
        totalPrice: Number(item.price) * item.quantity
      }))
    } as OrderResponse;
  }

  async getOrderSummary(storeId: string, userId: string): Promise<OrderSummaryResponse> {
    const store = await prisma.store.findFirst({
      where: { id: storeId, ownerId: userId }
    });

    if (!store) {
      throw new Error('Loja não encontrada ou não pertence ao usuário');
    }

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      preparingOrders,
      deliveringOrders,
      deliveredOrders,
      cancelledOrders,
      revenueResult
    ] = await Promise.all([
      prisma.order.count({ where: { storeId } }),
      prisma.order.count({ where: { storeId, status: 'PENDING' } }),
      prisma.order.count({ where: { storeId, status: 'CONFIRMED' } }),
      prisma.order.count({ where: { storeId, status: 'PREPARING' } }),
      prisma.order.count({ where: { storeId, status: 'OUT_FOR_DELIVERY' } }),
      prisma.order.count({ where: { storeId, status: 'DELIVERED' } }),
      prisma.order.count({ where: { storeId, status: 'CANCELLED' } }),
      prisma.order.aggregate({
        where: { storeId, status: 'DELIVERED' },
        _sum: { total: true }
      })
    ]);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      preparingOrders,
      deliveringOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: Number(revenueResult._sum.total || 0)
    };
  }
}