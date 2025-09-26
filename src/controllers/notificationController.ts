import { Response } from 'express';
import { notificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { UserRole, NotificationType, NotificationChannel, NotificationPriority } from '@prisma/client';

const sendNotificationSchema = z.object({
  userId: z.string().cuid('ID do usuário inválido'),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1, 'Título é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  data: z.record(z.string(), z.any()).optional(),
  channels: z.array(z.nativeEnum(NotificationChannel)).min(1, 'Pelo menos um canal é obrigatório'),
  priority: z.nativeEnum(NotificationPriority).optional(),
  scheduledAt: z.string().datetime().optional()
});

const bulkNotificationSchema = z.object({
  userIds: z.array(z.string().cuid()).min(1, 'Pelo menos um usuário é obrigatório'),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1, 'Título é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  data: z.record(z.string(), z.any()).optional(),
  channels: z.array(z.nativeEnum(NotificationChannel)).min(1, 'Pelo menos um canal é obrigatório'),
  priority: z.nativeEnum(NotificationPriority).optional(),
  scheduledAt: z.string().datetime().optional()
});

const updatePreferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  promotions: z.boolean().optional(),
  systemAlerts: z.boolean().optional()
});

const updateFCMTokenSchema = z.object({
  fcmToken: z.string().min(1, 'FCM Token é obrigatório')
});

export const sendNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.STORE_OWNER) {
      res.status(403).json({ 
        success: false,
        message: 'Acesso negado. Apenas administradores e donos de loja podem enviar notificações' 
      });
      return;
    }

    const validatedData = sendNotificationSchema.parse(req.body);
    
    const notificationData = {
      ...validatedData,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined
    };

    const notification = await notificationService.sendNotification(notificationData as any);
    
    res.status(201).json({ 
      success: true, 
      message: 'Notificação enviada com sucesso', 
      data: { notification } 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const sendBulkNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ 
        success: false,
        message: 'Acesso negado. Apenas administradores podem enviar notificações em massa' 
      });
      return;
    }

    const validatedData = bulkNotificationSchema.parse(req.body);
    
    const notificationData = {
      ...validatedData,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined
    };

    const notifications = await notificationService.sendBulkNotification(
      notificationData.userIds,
      notificationData as any
    );
    
    res.status(201).json({ 
      success: true, 
      message: `${notifications.length} notificações enviadas com sucesso`, 
      data: { notifications } 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateNotificationPreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const validatedData = updatePreferencesSchema.parse(req.body);
    const preferences = await notificationService.updateUserPreferences(
      req.user.userId,
      validatedData as any
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'Preferências de notificação atualizadas com sucesso', 
      data: { preferences } 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateFCMToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const validatedData = updateFCMTokenSchema.parse(req.body);
    
    const { prisma } = await import('../config/database');
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { fcmToken: validatedData.fcmToken }
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'FCM Token atualizado com sucesso' 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getNotificationHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const history = await notificationService.getNotificationHistory(req.user.userId, limit);
    
    res.status(200).json({ 
      success: true, 
      data: { history } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getNotificationPreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { prisma } = await import('../config/database');
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: req.user.userId }
    });

    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: req.user.userId,
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          orderUpdates: true,
          promotions: true,
          systemAlerts: true
        }
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: { preferences } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const sendOrderNotification = async (orderId: string, type: NotificationType, additionalData?: Record<string, any>): Promise<void> => {
  try {
    const { prisma } = await import('../config/database');
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, store: true }
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    const templates = {
      [NotificationType.ORDER_CONFIRMED]: {
        title: 'Pedido Confirmado!',
        message: `Seu pedido #${orderId.slice(-8)} foi confirmado e está sendo preparado.`
      },
      [NotificationType.ORDER_PREPARING]: {
        title: 'Pedido em Preparo',
        message: `Seu pedido #${orderId.slice(-8)} está sendo preparado pela ${order.store.name}.`
      },
      [NotificationType.ORDER_READY]: {
        title: 'Pedido Pronto!',
        message: `Seu pedido #${orderId.slice(-8)} está pronto para retirada.`
      },
      [NotificationType.ORDER_OUT_FOR_DELIVERY]: {
        title: 'Pedido Saiu para Entrega',
        message: `Seu pedido #${orderId.slice(-8)} saiu para entrega. Chegada estimada: ${order.store.estimatedDeliveryTime} minutos.`
      },
      [NotificationType.ORDER_DELIVERED]: {
        title: 'Pedido Entregue!',
        message: `Seu pedido #${orderId.slice(-8)} foi entregue com sucesso. Obrigado pela preferência!`
      },
      [NotificationType.ORDER_CANCELLED]: {
        title: 'Pedido Cancelado',
        message: `Seu pedido #${orderId.slice(-8)} foi cancelado.`
      },
      [NotificationType.PAYMENT_CONFIRMED]: {
        title: 'Pagamento Confirmado',
        message: `Pagamento do pedido #${orderId.slice(-8)} foi confirmado com sucesso.`
      },
      [NotificationType.PAYMENT_FAILED]: {
        title: 'Falha no Pagamento',
        message: `Houve uma falha no pagamento do pedido #${orderId.slice(-8)}. Tente novamente.`
      }
    };

    const template = templates[type as keyof typeof templates];
    if (!template) {
      throw new Error(`Template não encontrado para o tipo: ${type}`);
    }

    await notificationService.sendNotification({
      userId: order.userId,
      type: type as any,
      title: template.title,
      message: template.message,
      channels: [NotificationChannel.PUSH as any, NotificationChannel.EMAIL as any],
      priority: NotificationPriority.HIGH as any,
      data: {
        orderId,
        storeName: order.store.name,
        total: order.total,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Erro ao enviar notificação de pedido:', error);
  }
};
