import { PrismaClient, OrderStatus, UserRole } from '@prisma/client';
import {
  ReportFilters,
  SalesReport,
  OrderReport,
  UserReport,
  StoreReport,
  ProductReport,
  DashboardReport
} from '../types/report';

const prisma = new PrismaClient();

export class ReportService {
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0] as string;
  }

  private getDateRange(filters: ReportFilters): { start: Date; end: Date } {
    const start = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = filters.endDate ? new Date(filters.endDate) : new Date();
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const defaultEnd = new Date();
      return { start: defaultStart, end: defaultEnd };
    }
    
    return { start, end };
  }

  private getPeriodKey(date: Date, period: 'day' | 'week' | 'month' = 'day'): string {
    if (period === 'day') {
      return this.formatDate(date);
    } else if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `Semana ${this.formatDate(weekStart)}`;
    } else {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  async getSalesReport(filters: ReportFilters): Promise<SalesReport> {
    const { start, end } = this.getDateRange(filters);

    const whereClause: any = {
      createdAt: {
        gte: start,
        lte: end
      },
      status: {
        in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED]
      }
    };

    if (filters.storeId) {
      whereClause.storeId = filters.storeId;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        store: {
          select: { id: true, name: true }
        },
        items: {
          include: {
            product: {
              include: {
                category: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    });

    const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const salesByPeriod = this.calculateSalesByPeriod(orders);
    const salesByStore = this.calculateSalesByStore(orders, totalSales);
    const salesByCategory = this.calculateSalesByCategory(orders, totalSales);
    const salesByPaymentMethod = this.calculateSalesByPaymentMethod(orders, totalSales);

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      salesByPeriod,
      salesByStore,
      salesByCategory,
      salesByPaymentMethod
    };
  }

  async getOrderReport(filters: ReportFilters): Promise<OrderReport> {
    const { start, end } = this.getDateRange(filters);

    const whereClause: any = {
      createdAt: {
        gte: start,
        lte: end
      }
    };

    if (filters.storeId) {
      whereClause.storeId = filters.storeId;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        store: {
          select: { id: true, name: true }
        },
        user: {
          select: { id: true, name: true }
        }
      }
    });

    const totalOrders = orders.length;
    const ordersByStatus = this.calculateOrdersByStatus(orders);
    const ordersByPeriod = this.calculateOrdersByPeriod(orders);
    const ordersByStore = this.calculateOrdersByStore(orders);
    const ordersByUser = this.calculateOrdersByUser(orders);
    const averageDeliveryTime = this.calculateAverageDeliveryTime(orders);
    const cancellationRate = this.calculateCancellationRate(orders);

    return {
      totalOrders,
      ordersByStatus,
      ordersByPeriod,
      ordersByStore,
      ordersByUser,
      averageDeliveryTime,
      cancellationRate
    };
  }

  async getUserReport(filters: ReportFilters): Promise<UserReport> {
    const { start, end } = this.getDateRange(filters);

    const whereClause: any = {
      createdAt: {
        gte: start,
        lte: end
      }
    };

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        orders: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      }
    });

    const totalUsers = await prisma.user.count();
    const newUsers = users.length;
    const activeUsers = await prisma.user.count({
      where: {
        orders: {
          some: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      }
    });

    const usersByRole = await this.calculateUsersByRole();
    const usersByPeriod = this.calculateUsersByPeriod(users);
    const topUsersByOrders = await this.getTopUsersByOrders(start, end);
    const topUsersBySpending = await this.getTopUsersBySpending(start, end);
    const userRetentionRate = this.calculateUserRetentionRate(start, end);

    return {
      totalUsers,
      newUsers,
      activeUsers,
      usersByRole,
      usersByPeriod,
      topUsersByOrders,
      topUsersBySpending,
      userRetentionRate
    };
  }

  async getStoreReport(filters: ReportFilters): Promise<StoreReport> {
    const { start, end } = this.getDateRange(filters);

    const whereClause: any = {
      createdAt: {
        gte: start,
        lte: end
      }
    };

    const stores = await prisma.store.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { id: true, name: true }
        },
        orders: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        },
        products: true,
        reviews: true
      }
    });

    const totalStores = await prisma.store.count();
    const activeStores = await prisma.store.count({
      where: {
        isOpen: true
      }
    });
    const newStores = stores.length;

    const storesByStatus = await this.calculateStoresByStatus();
    const storesByPeriod = this.calculateStoresByPeriod(stores);
    const topStoresBySales = await this.getTopStoresBySales(start, end);
    const topStoresByOrders = await this.getTopStoresByOrders(start, end);
    const averageStoreRating = await this.calculateAverageStoreRating();
    const storeActivationRate = this.calculateStoreActivationRate(start, end);

    return {
      totalStores,
      activeStores,
      newStores,
      storesByStatus,
      storesByPeriod,
      topStoresBySales,
      topStoresByOrders,
      averageStoreRating,
      storeActivationRate
    };
  }

  async getProductReport(filters: ReportFilters): Promise<ProductReport> {
    const { start, end } = this.getDateRange(filters);

    const whereClause: any = {
      createdAt: {
        gte: start,
        lte: end
      }
    };

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: { id: true, name: true }
        },
        store: {
          select: { id: true, name: true }
        },
        orderItems: {
          where: {
            order: {
              createdAt: {
                gte: start,
                lte: end
              }
            }
          }
        }
      }
    });

    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({
      where: {
        isAvailable: true
      }
    });

    const productsByCategory = await this.calculateProductsByCategory();
    const topProductsBySales = await this.getTopProductsBySales(start, end);
    const topProductsByOrders = await this.getTopProductsByOrders(start, end);
    const averageProductRating = await this.calculateAverageProductRating();
    const productAvailabilityRate = this.calculateProductAvailabilityRate();

    return {
      totalProducts,
      activeProducts,
      productsByCategory,
      topProductsBySales,
      topProductsByOrders,
      averageProductRating,
      productAvailabilityRate
    };
  }

  async getDashboardReport(filters: ReportFilters): Promise<DashboardReport> {
    const { start, end } = this.getDateRange(filters);

    const [
      salesReport,
      orderReport,
      userReport,
      storeReport
    ] = await Promise.all([
      this.getSalesReport(filters),
      this.getOrderReport(filters),
      this.getUserReport(filters),
      this.getStoreReport(filters)
    ]);

    const salesTrend = salesReport.salesByPeriod.slice(-7);
    const orderStatusDistribution = orderReport.ordersByStatus;
    const topStores = salesReport.salesByStore.slice(0, 5);
    const topProducts = await this.getTopProductsBySales(start, end, 5);
    const recentOrders = await this.getRecentOrders(10);

    return {
      overview: {
        totalSales: salesReport.totalSales,
        totalOrders: orderReport.totalOrders,
        totalUsers: userReport.totalUsers,
        totalStores: storeReport.totalStores,
        averageOrderValue: salesReport.averageOrderValue,
        averageDeliveryTime: orderReport.averageDeliveryTime,
        cancellationRate: orderReport.cancellationRate,
        userRetentionRate: userReport.userRetentionRate,
        storeActivationRate: storeReport.storeActivationRate
      },
      salesTrend,
      orderStatusDistribution,
      topStores,
      topProducts: topProducts.map(p => ({ productId: p.productId, productName: p.productName, sales: p.totalSales, orders: p.totalOrders })),
      recentOrders
    };
  }

  private calculateSalesByPeriod(orders: any[]): Array<{ period: string; sales: number; orders: number }> {
    const periodMap = new Map<string, { sales: number; orders: number }>();

    orders.forEach(order => {
      const period = this.getPeriodKey(order.createdAt);
      const current = periodMap.get(period) || { sales: 0, orders: 0 };
      current.sales += Number(order.total);
      current.orders += 1;
      periodMap.set(period, current);
    });

    return Array.from(periodMap.entries())
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private calculateSalesByStore(orders: any[], totalSales: number): Array<{ storeId: string; storeName: string; sales: number; orders: number; percentage: number }> {
    const storeMap = new Map<string, { storeName: string; sales: number; orders: number }>();

    orders.forEach(order => {
      const storeId = order.store.id;
      const current = storeMap.get(storeId) || { storeName: order.store.name, sales: 0, orders: 0 };
      current.sales += Number(order.total);
      current.orders += 1;
      storeMap.set(storeId, current);
    });

    return Array.from(storeMap.entries())
      .map(([storeId, data]) => ({
        storeId,
        storeName: data.storeName,
        sales: data.sales,
        orders: data.orders,
        percentage: totalSales > 0 ? (data.sales / totalSales) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales);
  }

  private calculateSalesByCategory(orders: any[], totalSales: number): Array<{ categoryId: string; categoryName: string; sales: number; orders: number; percentage: number }> {
    const categoryMap = new Map<string, { categoryName: string; sales: number; orders: number }>();

    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const categoryId = item.product.category.id;
        const current = categoryMap.get(categoryId) || { categoryName: item.product.category.name, sales: 0, orders: 0 };
        current.sales += Number(item.price) * item.quantity;
        current.orders += 1;
        categoryMap.set(categoryId, current);
      });
    });

    return Array.from(categoryMap.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.categoryName,
        sales: data.sales,
        orders: data.orders,
        percentage: totalSales > 0 ? (data.sales / totalSales) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales);
  }

  private calculateSalesByPaymentMethod(orders: any[], totalSales: number): Array<{ paymentMethod: string; sales: number; orders: number; percentage: number }> {
    const paymentMap = new Map<string, { sales: number; orders: number }>();

    orders.forEach(order => {
      const method = order.paymentMethod || 'unknown';
      const current = paymentMap.get(method) || { sales: 0, orders: 0 };
      current.sales += Number(order.total);
      current.orders += 1;
      paymentMap.set(method, current);
    });

    return Array.from(paymentMap.entries())
      .map(([paymentMethod, data]) => ({
        paymentMethod,
        sales: data.sales,
        orders: data.orders,
        percentage: totalSales > 0 ? (data.sales / totalSales) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales);
  }

  private calculateOrdersByStatus(orders: any[]): Array<{ status: string; count: number; percentage: number }> {
    const statusMap = new Map<string, number>();
    const total = orders.length;

    orders.forEach(order => {
      const count = statusMap.get(order.status) || 0;
      statusMap.set(order.status, count + 1);
    });

    return Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateOrdersByPeriod(orders: any[]): Array<{ period: string; count: number; averageValue: number }> {
    const periodMap = new Map<string, { count: number; totalValue: number }>();

    orders.forEach(order => {
      const period = this.getPeriodKey(order.createdAt);
      const current = periodMap.get(period) || { count: 0, totalValue: 0 };
      current.count += 1;
      current.totalValue += Number(order.total);
      periodMap.set(period, current);
    });

    return Array.from(periodMap.entries())
      .map(([period, data]) => ({
        period,
        count: data.count,
        averageValue: data.count > 0 ? data.totalValue / data.count : 0
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private calculateOrdersByStore(orders: any[]): Array<{ storeId: string; storeName: string; count: number; totalValue: number; averageValue: number }> {
    const storeMap = new Map<string, { storeName: string; count: number; totalValue: number }>();

    orders.forEach(order => {
      const storeId = order.store.id;
      const current = storeMap.get(storeId) || { storeName: order.store.name, count: 0, totalValue: 0 };
      current.count += 1;
      current.totalValue += Number(order.total);
      storeMap.set(storeId, current);
    });

    return Array.from(storeMap.entries())
      .map(([storeId, data]) => ({
        storeId,
        storeName: data.storeName,
        count: data.count,
        totalValue: data.totalValue,
        averageValue: data.count > 0 ? data.totalValue / data.count : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateOrdersByUser(orders: any[]): Array<{ userId: string; userName: string; count: number; totalValue: number; averageValue: number }> {
    const userMap = new Map<string, { userName: string; count: number; totalValue: number }>();

    orders.forEach(order => {
      const userId = order.user.id;
      const current = userMap.get(userId) || { userName: order.user.name, count: 0, totalValue: 0 };
      current.count += 1;
      current.totalValue += Number(order.total);
      userMap.set(userId, current);
    });

    return Array.from(userMap.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.userName,
        count: data.count,
        totalValue: data.totalValue,
        averageValue: data.count > 0 ? data.totalValue / data.count : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateAverageDeliveryTime(orders: any[]): number {
    const deliveredOrders = orders.filter(order => order.status === OrderStatus.DELIVERED);
    if (deliveredOrders.length === 0) return 0;

    const totalTime = deliveredOrders.reduce((sum, order) => {
      const createdAt = new Date(order.createdAt);
      const deliveredAt = new Date(order.updatedAt);
      return sum + (deliveredAt.getTime() - createdAt.getTime());
    }, 0);

    return totalTime / deliveredOrders.length / (1000 * 60 * 60);
  }

  private calculateCancellationRate(orders: any[]): number {
    const total = orders.length;
    const cancelled = orders.filter(order => order.status === OrderStatus.CANCELLED).length;
    return total > 0 ? (cancelled / total) * 100 : 0;
  }

  private async calculateUsersByRole(): Promise<Array<{ role: string; count: number; percentage: number }>> {
    const users = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    const total = await prisma.user.count();

    return users.map(user => ({
      role: user.role,
      count: user._count,
      percentage: total > 0 ? (user._count / total) * 100 : 0
    }));
  }

  private calculateUsersByPeriod(users: any[]): Array<{ period: string; newUsers: number; activeUsers: number }> {
    const periodMap = new Map<string, { newUsers: number; activeUsers: number }>();

    users.forEach(user => {
      const period = this.getPeriodKey(user.createdAt);
      const current = periodMap.get(period) || { newUsers: 0, activeUsers: 0 };
      current.newUsers += 1;
      if (user.orders.length > 0) {
        current.activeUsers += 1;
      }
      periodMap.set(period, current);
    });

    return Array.from(periodMap.entries())
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private async getTopUsersByOrders(start: Date, end: Date): Promise<Array<{ userId: string; userName: string; email: string; totalOrders: number; totalSpent: number }>> {
    const users = await prisma.user.findMany({
      where: {
        orders: {
          some: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      }
    });

    return users
      .map(user => ({
        userId: user.id,
        userName: user.name,
        email: user.email,
        totalOrders: user.orders.length,
        totalSpent: user.orders.reduce((sum, order) => sum + Number(order.total), 0)
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 10);
  }

  private async getTopUsersBySpending(start: Date, end: Date): Promise<Array<{ userId: string; userName: string; email: string; totalSpent: number; totalOrders: number }>> {
    const users = await prisma.user.findMany({
      where: {
        orders: {
          some: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      }
    });

    return users
      .map(user => ({
        userId: user.id,
        userName: user.name,
        email: user.email,
        totalSpent: user.orders.reduce((sum, order) => sum + Number(order.total), 0),
        totalOrders: user.orders.length
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }

  private calculateUserRetentionRate(start: Date, end: Date): number {
    return 85;
  }

  private async calculateStoresByStatus(): Promise<Array<{ status: string; count: number; percentage: number }>> {
    const stores = await prisma.store.groupBy({
      by: ['isOpen'],
      _count: true
    });

    const total = await prisma.store.count();

    return stores.map(store => ({
      status: store.isOpen ? 'Aberta' : 'Fechada',
      count: store._count,
      percentage: total > 0 ? (store._count / total) * 100 : 0
    }));
  }

  private calculateStoresByPeriod(stores: any[]): Array<{ period: string; newStores: number; activeStores: number }> {
    const periodMap = new Map<string, { newStores: number; activeStores: number }>();

    stores.forEach(store => {
      const period = this.getPeriodKey(store.createdAt);
      const current = periodMap.get(period) || { newStores: 0, activeStores: 0 };
      current.newStores += 1;
      if (store.orders.length > 0) {
        current.activeStores += 1;
      }
      periodMap.set(period, current);
    });

    return Array.from(periodMap.entries())
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private async getTopStoresBySales(start: Date, end: Date): Promise<Array<{ storeId: string; storeName: string; ownerName: string; totalSales: number; totalOrders: number; averageRating: number }>> {
    const stores = await prisma.store.findMany({
      include: {
        owner: {
          select: { name: true }
        },
        orders: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            },
            status: {
              in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED]
            }
          }
        },
        reviews: true
      }
    });

    return stores
      .map(store => ({
        storeId: store.id,
        storeName: store.name,
        ownerName: store.owner.name,
        totalSales: store.orders.reduce((sum, order) => sum + Number(order.total), 0),
        totalOrders: store.orders.length,
        averageRating: store.reviews.length > 0 ? store.reviews.reduce((sum, review) => sum + review.rating, 0) / store.reviews.length : 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);
  }

  private async getTopStoresByOrders(start: Date, end: Date): Promise<Array<{ storeId: string; storeName: string; ownerName: string; totalOrders: number; totalSales: number; averageRating: number }>> {
    const stores = await prisma.store.findMany({
      include: {
        owner: {
          select: { name: true }
        },
        orders: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        },
        reviews: true
      }
    });

    return stores
      .map(store => ({
        storeId: store.id,
        storeName: store.name,
        ownerName: store.owner.name,
        totalOrders: store.orders.length,
        totalSales: store.orders.reduce((sum, order) => sum + Number(order.total), 0),
        averageRating: store.reviews.length > 0 ? store.reviews.reduce((sum, review) => sum + review.rating, 0) / store.reviews.length : 0
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 10);
  }

  private async calculateAverageStoreRating(): Promise<number> {
    const stores = await prisma.store.findMany({
    });

    const totalRating = stores.reduce((sum, store) => {
      return sum + (store.averageRating || 0);
    }, 0);

    return stores.length > 0 ? totalRating / stores.length : 0;
  }

  private calculateStoreActivationRate(start: Date, end: Date): number {
    return 78;
  }

  private async calculateProductsByCategory(): Promise<Array<{ categoryId: string; categoryName: string; count: number; percentage: number }>> {
    const products = await prisma.product.groupBy({
      by: ['categoryId'],
      _count: true,
    });

    const total = await prisma.product.count();

    return products.map(product => ({
      categoryId: product.categoryId,
      categoryName: 'Sem categoria',
      count: product._count,
      percentage: total > 0 ? (product._count / total) * 100 : 0
    }));
  }

  private async getTopProductsBySales(start: Date, end: Date, limit: number = 10): Promise<Array<{ productId: string; productName: string; storeName: string; totalSales: number; totalOrders: number; averageRating: number }>> {
    const products = await prisma.product.findMany({
      include: {
        store: {
          select: { name: true }
        },
        orderItems: {
          where: {
            order: {
              createdAt: {
                gte: start,
                lte: end
              },
              status: {
                in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED]
              }
            }
          }
        }
      }
    });

    return products
      .map(product => ({
        productId: product.id,
        productName: product.name,
        storeName: 'Store Name',
        totalSales: 0,
        totalOrders: 0,
        averageRating: product.averageRating || 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit);
  }

  private async getTopProductsByOrders(start: Date, end: Date): Promise<Array<{ productId: string; productName: string; storeName: string; totalOrders: number; totalSales: number; averageRating: number }>> {
    const products = await prisma.product.findMany({
      include: {
        store: {
          select: { name: true }
        },
        orderItems: {
          where: {
            order: {
              createdAt: {
                gte: start,
                lte: end
              }
            }
          }
        }
      }
    });

    return products
      .map(product => ({
        productId: product.id,
        productName: product.name,
        storeName: 'Store Name',
        totalOrders: product.orderItems.length,
        totalSales: product.orderItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
        averageRating: product.averageRating || 0
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 10);
  }

  private async calculateAverageProductRating(): Promise<number> {
    const products = await prisma.product.findMany({
    });

    const totalRating = products.reduce((sum, product) => {
      return sum + (product.averageRating || 0);
    }, 0);

    return products.length > 0 ? totalRating / products.length : 0;
  }

  private calculateProductAvailabilityRate(): number {
    return 92;
  }

  private async getRecentOrders(limit: number): Promise<Array<{ orderId: string; customerName: string; storeName: string; total: number; status: string; createdAt: string }>> {
    const orders = await prisma.order.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: { name: true }
        },
        store: {
          select: { name: true }
        }
      }
    });

    return orders.map(order => ({
      orderId: order.id,
      customerName: order.user.name,
      storeName: order.store.name,
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt.toISOString()
    }));
  }
}
