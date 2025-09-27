import { Response } from 'express';
import { CartService } from '../services/cartService';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const cartService = new CartService();

const addToCartSchema = z.object({
  productId: z.string().cuid('ID do produto inválido'),
  quantity: z.number().int().min(1, 'Quantidade deve ser no mínimo 1')
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantidade deve ser no mínimo 1')
});

export const getCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const cart = await cartService.getOrCreateCart(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Carrinho obtido com sucesso',
      data: { cart }
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter carrinho', 
      error: error.message 
    });
  }
};

export const addToCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const validatedData = addToCartSchema.parse(req.body);
    const cartItem = await cartService.addToCart(req.user.id, validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Produto adicionado ao carrinho com sucesso',
      data: { cartItem }
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
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const updateCartItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { itemId } = req.params;
    if (!itemId) {
      res.status(400).json({ 
        success: false, 
        message: 'ID do item é obrigatório' 
      });
      return;
    }

    const validatedData = updateCartItemSchema.parse(req.body);
    const cartItem = await cartService.updateCartItem(req.user.id, itemId, validatedData);
    
    res.status(200).json({
      success: true,
      message: 'Item do carrinho atualizado com sucesso',
      data: { cartItem }
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
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const removeFromCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { itemId } = req.params;
    if (!itemId) {
      res.status(400).json({ 
        success: false, 
        message: 'ID do item é obrigatório' 
      });
      return;
    }

    await cartService.removeFromCart(req.user.id, itemId);
    
    res.status(200).json({
      success: true,
      message: 'Item removido do carrinho com sucesso'
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const clearCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    await cartService.clearCart(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Carrinho limpo com sucesso'
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao limpar carrinho', 
      error: error.message 
    });
  }
};

export const getCartSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const summary = await cartService.getCartSummary(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Resumo do carrinho obtido com sucesso',
      data: { summary }
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter resumo do carrinho', 
      error: error.message 
    });
  }
};
