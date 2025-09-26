import { Response } from 'express';
import { OrderService } from '../services/orderService';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { UserRole, OrderStatus } from '@prisma/client';

const orderService = new OrderService();

const createOrderSchema = z.object({
  storeId: z.string().cuid('ID da loja inválido'),
  addressId: z.string().cuid('ID do endereço inválido'),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'CASH']),
  deliveryInstructions: z.string().optional(),
  couponCode: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z.string().optional(),
});

export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const validatedData = createOrderSchema.parse(req.body);
    const newOrder = await orderService.createOrder(req.user.userId, validatedData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Pedido criado com sucesso', 
      data: { order: newOrder } 
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

export const getUserOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await orderService.getUserOrders(req.user.userId, page, limit);
    
    res.status(200).json({ 
      success: true, 
      message: 'Pedidos obtidos com sucesso', 
      data: result 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStoreOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.STORE_OWNER) {
      res.status(403).json({ 
        success: false,
        message: 'Acesso negado: Apenas donos de loja podem ver pedidos da loja' 
      });
      return;
    }

    const { storeId } = req.params;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'ID da loja é obrigatório' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await orderService.getStoreOrders(storeId, req.user.userId, page, limit);
    
    res.status(200).json({ 
      success: true, 
      message: 'Pedidos da loja obtidos com sucesso', 
      data: result 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID do pedido é obrigatório' });
      return;
    }

    const order = await orderService.getOrderById(id, req.user.userId);
    
    res.status(200).json({ 
      success: true, 
      message: 'Pedido obtido com sucesso', 
      data: { order } 
    });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.STORE_OWNER) {
      res.status(403).json({ 
        success: false,
        message: 'Acesso negado: Apenas donos de loja podem atualizar status dos pedidos' 
      });
      return;
    }

    const { storeId, id } = req.params;
    if (!storeId || !id) {
      res.status(400).json({ success: false, message: 'IDs da loja e do pedido são obrigatórios' });
      return;
    }

    const validatedData = updateOrderStatusSchema.parse(req.body);
    const updatedOrder = await orderService.updateOrderStatus(id, storeId, req.user.userId, validatedData);
    
    res.status(200).json({ 
      success: true, 
      message: 'Status do pedido atualizado com sucesso', 
      data: { order: updatedOrder } 
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

export const cancelOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID do pedido é obrigatório' });
      return;
    }

    const cancelledOrder = await orderService.cancelOrder(id, req.user.userId);
    
    res.status(200).json({ 
      success: true, 
      message: 'Pedido cancelado com sucesso', 
      data: { order: cancelledOrder } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOrderSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.STORE_OWNER) {
      res.status(403).json({ 
        success: false,
        message: 'Acesso negado: Apenas donos de loja podem ver resumo dos pedidos' 
      });
      return;
    }

    const { storeId } = req.params;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'ID da loja é obrigatório' });
      return;
    }

    const summary = await orderService.getOrderSummary(storeId, req.user.userId);
    
    res.status(200).json({ 
      success: true, 
      message: 'Resumo dos pedidos obtido com sucesso', 
      data: { summary } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
