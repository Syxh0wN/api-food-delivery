import { Response } from 'express';
import { OrderService } from '../services/orderService';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendNotFound } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';
import { CreateOrderInput, UpdateOrderStatusInput } from '../schemas/orderSchemas';

const orderService = new OrderService();

export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const validatedData = req.body as CreateOrderInput;
  const newOrder = await orderService.createOrder(req.user.id, validatedData);
  sendSuccess(res, 'Pedido criado com sucesso', { order: newOrder }, 201);
};

export const getUserOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await orderService.getUserOrders(req.user.id, page, limit);
  sendSuccess(res, 'Pedidos obtidos com sucesso', result);
};

export const getStoreOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== UserRole.STORE_OWNER) {
    res.status(403).json({ 
      success: false,
      message: 'Acesso negado: Apenas donos de loja podem ver pedidos da loja' 
    });
    return;
  }

  const { storeId } = req.params as { storeId: string };
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await orderService.getStoreOrders(storeId, req.user.id, page, limit);
  sendSuccess(res, 'Pedidos da loja obtidos com sucesso', result);
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { id } = req.params as { id: string };
  const order = await orderService.getOrderById(id, req.user.id);
  sendSuccess(res, 'Pedido obtido com sucesso', { order });
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== UserRole.STORE_OWNER) {
    res.status(403).json({ 
      success: false,
      message: 'Acesso negado: Apenas donos de loja podem atualizar status dos pedidos' 
    });
    return;
  }

  const { storeId, id } = req.params as { storeId: string; id: string };
  const validatedData = req.body as UpdateOrderStatusInput;
  const updatedOrder = await orderService.updateOrderStatus(id, storeId, req.user.id, validatedData);
  sendSuccess(res, 'Status do pedido atualizado com sucesso', { order: updatedOrder });
};

export const cancelOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { id } = req.params as { id: string };
  const cancelledOrder = await orderService.cancelOrder(id, req.user.id);
  sendSuccess(res, 'Pedido cancelado com sucesso', { order: cancelledOrder });
};

export const getOrderSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== UserRole.STORE_OWNER) {
    res.status(403).json({ 
      success: false,
      message: 'Acesso negado: Apenas donos de loja podem ver resumo dos pedidos' 
    });
    return;
  }

  const { storeId } = req.params as { storeId: string };
  const summary = await orderService.getOrderSummary(storeId, req.user.id);
  sendSuccess(res, 'Resumo dos pedidos obtido com sucesso', { summary });
};
