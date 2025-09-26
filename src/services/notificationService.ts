import { prisma } from '../config/database';
import {
  NotificationRequest,
  NotificationResponse,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority
} from '../types/notification';

class NotificationService {
  async sendNotification(request: NotificationRequest): Promise<NotificationResponse> {
    const user = await prisma.user.findUnique({
      where: { id: request.userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const notification = await prisma.notification.create({
      data: {
        userId: request.userId,
        type: request.type as any,
        title: request.title,
        message: request.message,
        channels: request.channels as any[],
        status: NotificationStatus.PENDING,
        priority: request.priority as any,
        scheduledAt: request.scheduledAt || new Date(),
        data: request.data || {}
      }
    });

    // Simular envio de notificação (em produção, integrar com Firebase, Email, SMS)
    const sent = await this.simulateNotificationSend(request);

    const finalStatus = sent ? NotificationStatus.SENT : NotificationStatus.FAILED;

    await prisma.notification.update({
      where: { id: notification.id },
      data: { 
        status: finalStatus,
        sentAt: sent ? new Date() : null
      }
    });

    // Salvar no histórico
    for (const channel of request.channels) {
      await prisma.notificationHistory.create({
        data: {
          userId: request.userId,
          type: request.type as any,
          channel: channel as any,
          title: request.title,
          message: request.message,
          status: finalStatus,
          sentAt: sent ? new Date() : null,
          errorMessage: sent ? null : 'Simulação de erro'
        }
      });
    }

    return {
      id: notification.id,
      userId: notification.userId,
      type: request.type,
      title: notification.title,
      message: notification.message,
      channels: request.channels,
      status: finalStatus,
      sentAt: sent ? new Date() : undefined,
      createdAt: notification.createdAt
    } as NotificationResponse;
  }

  private async simulateNotificationSend(request: NotificationRequest): Promise<boolean> {
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simular sucesso baseado no canal
    if (request.channels.includes(NotificationChannel.EMAIL)) {
      return Math.random() > 0.1; // 90% de sucesso
    }
    
    if (request.channels.includes(NotificationChannel.PUSH)) {
      return Math.random() > 0.2; // 80% de sucesso
    }
    
    if (request.channels.includes(NotificationChannel.SMS)) {
      return Math.random() > 0.3; // 70% de sucesso
    }
    
    return true;
  }

  async sendBulkNotification(userIds: string[], request: Omit<NotificationRequest, 'userId'>): Promise<NotificationResponse[]> {
    const results: NotificationResponse[] = [];

    for (const userId of userIds) {
      try {
        const result = await this.sendNotification({
          ...request,
          userId
        });
        results.push(result);
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
      }
    }

    return results;
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<any> {
    return await prisma.notificationPreferences.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        orderUpdates: true,
        promotions: true,
        systemAlerts: true,
        ...preferences
      }
    });
  }

  async getNotificationHistory(userId: string, limit: number = 50): Promise<any[]> {
    const history = await prisma.notificationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return history.map(item => ({
      id: item.id,
      userId: item.userId,
      type: item.type,
      channel: item.channel,
      title: item.title,
      message: item.message,
      status: item.status,
      sentAt: item.sentAt,
      errorMessage: item.errorMessage,
      createdAt: item.createdAt
    }));
  }
}

export const notificationService = new NotificationService();