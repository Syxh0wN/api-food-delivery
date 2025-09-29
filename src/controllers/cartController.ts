import { Response } from 'express';
import { CartService } from '../services/cartService';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess } from '../middleware/errorHandler';
import { AddToCartInput, UpdateCartItemInput } from '../schemas/cartSchemas';

const cartService = new CartService();

export const getCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const cart = await cartService.getOrCreateCart(req.user.id);
  sendSuccess(res, 'Carrinho obtido com sucesso', { cart });
};

export const addToCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const validatedData = req.body as AddToCartInput;
  const cartItem = await cartService.addToCart(req.user.id, validatedData);
  sendSuccess(res, 'Produto adicionado ao carrinho com sucesso', { cartItem }, 201);
};

export const updateCartItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { itemId } = req.params as { itemId: string };
  const validatedData = req.body as UpdateCartItemInput;
  const cartItem = await cartService.updateCartItem(req.user.id, itemId, validatedData);
  sendSuccess(res, 'Item do carrinho atualizado com sucesso', { cartItem });
};

export const removeFromCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { itemId } = req.params as { itemId: string };
  await cartService.removeFromCart(req.user.id, itemId);
  sendSuccess(res, 'Item removido do carrinho com sucesso');
};

export const clearCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  await cartService.clearCart(req.user.id);
  sendSuccess(res, 'Carrinho limpo com sucesso');
};

export const getCartSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const summary = await cartService.getCartSummary(req.user.id);
  sendSuccess(res, 'Resumo do carrinho obtido com sucesso', { summary });
};
