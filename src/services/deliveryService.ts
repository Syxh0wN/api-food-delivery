import { PrismaClient, OrderStatus, DeliveryStatus, DeliveryMethod } from '@prisma/client';
import { 
  CreateDeliveryTrackingInput, 
  UpdateDeliveryStatusInput, 
  DeliveryTracking, 
  DeliveryEstimate,
  DeliveryPerson,
  CreateDeliveryPersonInput,
  UpdateDeliveryPersonInput,
  DeliveryStats,
  OrderTrackingResponse,
  DeliveryFilter,
  DeliveryListResponse,
  DeliveryPersonListResponse,
  OrderImprovementStats,
  DeliveryLocation
} from '../types/delivery';
import { HistoryHelper } from '../utils/historyHelper';
import { HistoryAction, HistoryEntity } from '@prisma/client';

export class DeliveryService {
  constructor(private prisma: PrismaClient) {}

  async createDeliveryTracking(input: CreateDeliveryTrackingInput): Promise<DeliveryTracking> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: {
        user: true,
        store: true,
        address: true
      }
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    const trackingCode = input.trackingCode || this.generateTrackingCode();

    const deliveryTracking = await this.prisma.deliveryTracking.create({
      data: {
        orderId: input.orderId,
        status: DeliveryStatus.PENDING,
        method: input.method,
        estimatedDeliveryTime: input.estimatedDeliveryTime || null,
        deliveryPersonId: input.deliveryPersonId || null,
        trackingCode,
        notes: input.notes || null,
        locations: []
      }
    });

    await HistoryHelper.logOrderAction(
      input.orderId,
      HistoryAction.STATUS_CHANGE,
      `Rastreamento de entrega criado - Código: ${trackingCode}`,
      undefined,
      {
        trackingCode,
        method: input.method,
        deliveryPersonId: input.deliveryPersonId
      }
    );

    return this.formatDeliveryTracking(deliveryTracking);
  }

  async updateDeliveryStatus(
    trackingId: string, 
    input: UpdateDeliveryStatusInput,
    userId?: string
  ): Promise<DeliveryTracking> {
    const tracking = await this.prisma.deliveryTracking.findUnique({
      where: { id: trackingId },
      include: { order: true }
    });

    if (!tracking) {
      throw new Error('Rastreamento não encontrado');
    }

    const updateData: any = {
      status: input.status,
      notes: input.notes,
      actualDeliveryTime: input.actualDeliveryTime
    };

    if (input.location) {
      const locations = (tracking.locations as any) || [];
      locations.push(input.location);
      updateData.locations = locations;
    }

    const updatedTracking = await this.prisma.deliveryTracking.update({
      where: { id: trackingId },
      data: updateData
    });

    await this.prisma.order.update({
      where: { id: tracking.orderId },
      data: { 
        status: this.mapDeliveryStatusToOrderStatus(input.status),
        updatedAt: new Date()
      }
    });

    await HistoryHelper.logOrderAction(
      tracking.orderId,
      HistoryAction.STATUS_CHANGE,
      `Status de entrega atualizado para: ${input.status}`,
      undefined,
      {
        previousStatus: tracking.status,
        newStatus: input.status,
        location: input.location,
        updatedBy: userId
      }
    );

    return this.formatDeliveryTracking(updatedTracking);
  }

  async getOrderTracking(orderId: string): Promise<OrderTrackingResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true
          }
        },
        address: true,
        deliveryTracking: true
      }
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    if (!order.deliveryTracking) {
      throw new Error('Rastreamento não encontrado para este pedido');
    }

    const timeline = this.buildDeliveryTimeline(order.deliveryTracking);

    return {
      order: {
        id: order.id,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt,
        ...(order.deliveryTracking?.estimatedDeliveryTime && {
          estimatedDeliveryTime: order.deliveryTracking.estimatedDeliveryTime
        })
      },
      tracking: this.formatDeliveryTracking(order.deliveryTracking),
      store: {
        id: order.store.id,
        name: order.store.name,
        address: order.store.address as any,
        phone: order.store.phone
      },
      customer: {
        id: order.user.id,
        name: order.user.name,
        phone: order.user.phone || ''
      },
      deliveryAddress: {
        street: order.address.street,
        number: order.address.number,
        neighborhood: order.address.neighborhood,
        city: order.address.city,
        state: order.address.state,
        zipCode: order.address.zipCode,
        ...(order.address.complement && {
          complement: order.address.complement
        })
      },
      timeline
    };
  }

  async calculateDeliveryEstimate(orderId: string): Promise<DeliveryEstimate> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        address: true
      }
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    const storePreparationTime = order.store.estimatedDeliveryTime || 30;
    const distance = await this.calculateDistance(
      order.store.address as any,
      order.address
    );
    const trafficFactor = await this.getTrafficFactor();
    const weatherFactor = await this.getWeatherFactor();

    const estimatedDeliveryTime = Math.round(
      (distance * 2) + (trafficFactor * 5) + (weatherFactor * 3)
    );

    const estimatedTotalTime = storePreparationTime + estimatedDeliveryTime;
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setMinutes(estimatedDeliveryDate.getMinutes() + estimatedTotalTime);

    return {
      orderId,
      estimatedPreparationTime: storePreparationTime,
      estimatedDeliveryTime,
      estimatedTotalTime,
      estimatedDeliveryDate,
      factors: {
        storePreparationTime,
        distance,
        trafficFactor,
        weatherFactor
      }
    };
  }

  async createDeliveryPerson(input: CreateDeliveryPersonInput): Promise<DeliveryPerson> {
    const existingPerson = await this.prisma.deliveryPerson.findUnique({
      where: { email: input.email }
    });

    if (existingPerson) {
      throw new Error('Email já está em uso');
    }

    const deliveryPerson = await this.prisma.deliveryPerson.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        password: input.password,
        isActive: true,
        isAvailable: true,
        totalDeliveries: 0,
        averageRating: 0
      }
    });

    await HistoryHelper.logSystemAction(
      HistoryAction.CREATE,
      `Entregador criado: ${input.name}`,
      undefined,
      {
        deliveryPersonId: deliveryPerson.id,
        name: input.name,
        email: input.email
      }
    );

    return this.formatDeliveryPerson(deliveryPerson);
  }

  async updateDeliveryPerson(
    deliveryPersonId: string, 
    input: UpdateDeliveryPersonInput
  ): Promise<DeliveryPerson> {
    const deliveryPerson = await this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: input
    });

    await HistoryHelper.logSystemAction(
      HistoryAction.UPDATE,
      `Entregador atualizado: ${deliveryPerson.name}`,
      undefined,
      {
        deliveryPersonId,
        updates: input
      }
    );

    return this.formatDeliveryPerson(deliveryPerson);
  }

  async getDeliveryStats(filter?: Partial<DeliveryFilter>): Promise<DeliveryStats> {
    const where: any = {};
    
    if (filter?.status) where.status = filter.status;
    if (filter?.method) where.method = filter.method;
    if (filter?.deliveryPersonId) where.deliveryPersonId = filter.deliveryPersonId;
    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    const [
      totalDeliveries,
      completedDeliveries,
      failedDeliveries,
      deliveryTimes,
      deliveryPersonStats
    ] = await Promise.all([
      this.prisma.deliveryTracking.count({ where }),
      this.prisma.deliveryTracking.count({ 
        where: { ...where, status: DeliveryStatus.DELIVERED } 
      }),
      this.prisma.deliveryTracking.count({ 
        where: { ...where, status: DeliveryStatus.FAILED_DELIVERY } 
      }),
      this.getDeliveryTimes(where),
      this.getDeliveryPersonStats(where)
    ]);

    const averageDeliveryTime = deliveryTimes.length > 0 
      ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length 
      : 0;

    const onTimeDeliveries = deliveryTimes.filter(time => time <= 30).length;
    const lateDeliveries = deliveryTimes.length - onTimeDeliveries;

    return {
      totalDeliveries,
      completedDeliveries,
      failedDeliveries,
      averageDeliveryTime,
      onTimeDeliveries,
      lateDeliveries,
      deliveryPersonStats
    };
  }

  async getOrderImprovementStats(): Promise<OrderImprovementStats> {
    const [
      totalOrders,
      ordersByStatus,
      averageOrderTime,
      deliveryStats,
      storePerformance
    ] = await Promise.all([
      this.prisma.order.count(),
      this.getOrdersByStatus(),
      this.getAverageOrderTime(),
      this.getDeliveryStats(),
      this.getStorePerformance()
    ]);

    const onTimeDeliveryRate = deliveryStats.totalDeliveries > 0 
      ? (deliveryStats.onTimeDeliveries / deliveryStats.totalDeliveries) * 100 
      : 0;

    const customerSatisfactionScore = await this.getCustomerSatisfactionScore();

    return {
      totalOrders,
      ordersByStatus,
      averageOrderTime,
      onTimeDeliveryRate,
      customerSatisfactionScore,
      deliveryPersonEfficiency: deliveryStats.deliveryPersonStats.map(stat => ({
        deliveryPersonId: stat.deliveryPersonId,
        name: stat.deliveryPersonName,
        efficiency: stat.averageRating,
        totalOrders: stat.totalDeliveries
      })),
      storePerformance
    };
  }

  private generateTrackingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private mapDeliveryStatusToOrderStatus(deliveryStatus: DeliveryStatus): OrderStatus {
    const statusMap: Record<DeliveryStatus, OrderStatus> = {
      [DeliveryStatus.PENDING]: OrderStatus.PENDING,
      [DeliveryStatus.CONFIRMED]: OrderStatus.CONFIRMED,
      [DeliveryStatus.PREPARING]: OrderStatus.PREPARING,
      [DeliveryStatus.READY_FOR_PICKUP]: OrderStatus.READY,
      [DeliveryStatus.OUT_FOR_DELIVERY]: OrderStatus.OUT_FOR_DELIVERY,
      [DeliveryStatus.DELIVERED]: OrderStatus.DELIVERED,
      [DeliveryStatus.FAILED_DELIVERY]: OrderStatus.CANCELLED,
      [DeliveryStatus.RETURNED]: OrderStatus.CANCELLED
    };
    return statusMap[deliveryStatus] || OrderStatus.PENDING;
  }

  private buildDeliveryTimeline(tracking: any): Array<{
    status: DeliveryStatus;
    timestamp: Date;
    description: string;
    location?: DeliveryLocation;
  }> {
    const timeline: Array<{
      status: DeliveryStatus;
      timestamp: Date;
      description: string;
      location?: DeliveryLocation;
    }> = [];
    const locations = (tracking.locations as any) || [];

    timeline.push({
      status: DeliveryStatus.PENDING,
      timestamp: tracking.createdAt,
      description: 'Pedido confirmado e rastreamento iniciado'
    });

    if (tracking.status !== DeliveryStatus.PENDING) {
      const timelineItem: any = {
        status: tracking.status,
        timestamp: tracking.updatedAt,
        description: this.getStatusDescription(tracking.status)
      };
      
      if (locations.length > 0) {
        timelineItem.location = locations[locations.length - 1];
      }
      
      timeline.push(timelineItem);
    }

    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private getStatusDescription(status: DeliveryStatus): string {
    const descriptions: Record<DeliveryStatus, string> = {
      [DeliveryStatus.PENDING]: 'Aguardando confirmação',
      [DeliveryStatus.CONFIRMED]: 'Pedido confirmado',
      [DeliveryStatus.PREPARING]: 'Pedido sendo preparado',
      [DeliveryStatus.READY_FOR_PICKUP]: 'Pedido pronto para retirada',
      [DeliveryStatus.OUT_FOR_DELIVERY]: 'Pedido saiu para entrega',
      [DeliveryStatus.DELIVERED]: 'Pedido entregue',
      [DeliveryStatus.FAILED_DELIVERY]: 'Falha na entrega',
      [DeliveryStatus.RETURNED]: 'Pedido retornado'
    };
    return descriptions[status] || 'Status desconhecido';
  }

  private async calculateDistance(storeAddress: any, deliveryAddress: any): Promise<number> {
    // Simulação de cálculo de distância
    // Em produção, usar API de geocoding real
    return Math.random() * 10 + 1; // 1-11 km
  }

  private async getTrafficFactor(): Promise<number> {
    // Simulação de fator de tráfego
    return Math.random() * 2 + 0.5; // 0.5-2.5
  }

  private async getWeatherFactor(): Promise<number> {
    // Simulação de fator climático
    return Math.random() * 1.5 + 0.2; // 0.2-1.7
  }

  private async getDeliveryTimes(where: any): Promise<number[]> {
    // Simulação de tempos de entrega
    return Array.from({ length: 10 }, () => Math.random() * 60 + 15); // 15-75 min
  }

  private async getDeliveryPersonStats(where: any): Promise<Array<{
    deliveryPersonId: string;
    deliveryPersonName: string;
    totalDeliveries: number;
    averageRating: number;
    onTimePercentage: number;
  }>> {
    // Simulação de estatísticas de entregadores
    return [];
  }

  private async getOrdersByStatus(): Promise<Record<OrderStatus, number>> {
    const orders = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const result: Record<string, number> = {};
    Object.values(OrderStatus).forEach(status => {
      result[status] = 0;
    });

    orders.forEach(item => {
      result[item.status] = item._count.status;
    });

    return result as Record<OrderStatus, number>;
  }

  private async getAverageOrderTime(): Promise<number> {
    // Simulação de tempo médio de pedido
    return 45; // 45 minutos
  }

  private async getStorePerformance(): Promise<Array<{
    storeId: string;
    storeName: string;
    averagePreparationTime: number;
    onTimeRate: number;
  }>> {
    // Simulação de performance das lojas
    return [];
  }

  private async getCustomerSatisfactionScore(): Promise<number> {
    const reviews = await this.prisma.review.aggregate({
      _avg: { rating: true }
    });
    return reviews._avg.rating || 0;
  }

  private formatDeliveryTracking(tracking: any): DeliveryTracking {
    return {
      id: tracking.id,
      orderId: tracking.orderId,
      status: tracking.status,
      method: tracking.method,
      estimatedDeliveryTime: tracking.estimatedDeliveryTime,
      actualDeliveryTime: tracking.actualDeliveryTime,
      deliveryPersonId: tracking.deliveryPersonId,
      deliveryPersonName: tracking.deliveryPersonName,
      deliveryPersonPhone: tracking.deliveryPersonPhone,
      trackingCode: tracking.trackingCode,
      locations: tracking.locations || [],
      notes: tracking.notes,
      createdAt: tracking.createdAt,
      updatedAt: tracking.updatedAt
    };
  }

  private formatDeliveryPerson(person: any): DeliveryPerson {
    return {
      id: person.id,
      name: person.name,
      phone: person.phone,
      email: person.email,
      isActive: person.isActive,
      currentLocation: person.currentLocation,
      isAvailable: person.isAvailable,
      totalDeliveries: person.totalDeliveries,
      averageRating: person.averageRating,
      createdAt: person.createdAt
    };
  }
}
