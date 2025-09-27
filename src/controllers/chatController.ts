import { Response } from 'express';
import { chatService } from '../services/chatService';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { UserRole, SenderType, MessageType } from '@prisma/client';

const createMessageSchema = z.object({
  orderId: z.string().min(1, 'ID do pedido é obrigatório'),
  message: z.string().min(1, 'Mensagem não pode estar vazia').max(1000, 'Mensagem muito longa'),
  messageType: z.nativeEnum(MessageType).optional().default(MessageType.TEXT)
});

const chatHistorySchema = z.object({
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default(50),
  offset: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(0)).optional().default(0)
});

const chatRoomsSchema = z.object({
  isActive: z.string().transform((val) => val === 'true').optional(),
  hasUnread: z.string().transform((val) => val === 'true').optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default(20),
  offset: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(0)).optional().default(0)
});

const statsSchema = z.object({
  start: z.string().transform((val) => new Date(val)).optional(),
  end: z.string().transform((val) => new Date(val)).optional()
});

export const createChatRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        success: false,
        message: 'ID do pedido é obrigatório'
      });
      return;
    }

    const chatRoom = await chatService.createChatRoom(orderId);
    
    res.status(201).json({ 
      success: true, 
      message: 'Sala de chat criada com sucesso', 
      data: { chatRoom } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const validatedData = createMessageSchema.parse(req.body);
    
    const message = await chatService.sendMessage(req.user.id, validatedData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso', 
      data: { message } 
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

export const getChatHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { orderId } = req.params;
    
    if (!orderId) {
      res.status(400).json({
        success: false,
        message: 'ID do pedido é obrigatório'
      });
      return;
    }

    const validatedData = chatHistorySchema.parse(req.query);

    const chatHistory = await chatService.getChatHistory(
      orderId, 
      req.user.id, 
      validatedData.limit, 
      validatedData.offset
    );
    
    res.status(200).json({ 
      success: true, 
      data: { chatHistory } 
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

export const markMessagesAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        success: false,
        message: 'ID do pedido é obrigatório'
      });
      return;
    }

    await chatService.markMessagesAsRead(orderId, req.user.id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Mensagens marcadas como lidas' 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getChatRooms = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const validatedData = chatRoomsSchema.parse(req.query);
    
    const chatRooms = await chatService.getChatRooms(req.user.id, validatedData as any);
    
    res.status(200).json({ 
      success: true, 
      data: { chatRooms } 
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

export const getChatRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        success: false,
        message: 'ID do pedido é obrigatório'
      });
      return;
    }

    const chatRoom = await chatService.getChatRoomByOrderId(orderId);
    
    res.status(200).json({ 
      success: true, 
      data: { chatRoom } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getChatStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const validatedData = statsSchema.parse(req.query);
    
    const period = {
      start: validatedData.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: validatedData.end || new Date()
    };

    const stats = await chatService.getChatStats(req.user.id, period);
    
    res.status(200).json({ 
      success: true, 
      data: { stats } 
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

export const closeChatRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        success: false,
        message: 'ID do pedido é obrigatório'
      });
      return;
    }

    await chatService.closeChatRoom(orderId, req.user.id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Sala de chat fechada com sucesso' 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const sendSystemMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        message: 'Apenas administradores e donos de loja podem enviar mensagens do sistema'
      });
      return;
    }

    const { orderId, type, message, metadata } = req.body;

    if (!orderId || !type || !message) {
      res.status(400).json({
        success: false,
        message: 'orderId, type e message são obrigatórios'
      });
      return;
    }

    const systemMessage = {
      orderId,
      type,
      message,
      metadata: metadata || {}
    };

    const result = await chatService.sendSystemMessage(systemMessage);
    
    res.status(201).json({ 
      success: true, 
      message: 'Mensagem do sistema enviada com sucesso', 
      data: { message: result } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
