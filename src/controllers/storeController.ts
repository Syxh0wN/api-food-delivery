import { Response } from 'express';
import { StoreService } from '../services/storeService';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const storeService = new StoreService();

const createStoreSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  phone: z.string().min(10, 'Telefone deve ter no mínimo 10 caracteres'),
  address: z.object({
    street: z.string().min(3, 'Rua deve ter no mínimo 3 caracteres'),
    number: z.string().min(1, 'Número deve ter no mínimo 1 caractere'),
    complement: z.string().optional(),
    neighborhood: z.string().min(3, 'Bairro deve ter no mínimo 3 caracteres'),
    city: z.string().min(3, 'Cidade deve ter no mínimo 3 caracteres'),
    state: z.string().length(2, 'Estado deve ter 2 caracteres (UF)'),
    zipCode: z.string().length(8, 'CEP deve ter 8 caracteres')
  }),
  deliveryRadius: z.number().min(1, 'Raio de entrega deve ser no mínimo 1 km'),
  estimatedDeliveryTime: z.number().min(15, 'Tempo estimado deve ser no mínimo 15 minutos'),
  minimumOrderValue: z.number().min(0, 'Valor mínimo deve ser 0 ou maior'),
  isOpen: z.boolean().optional(),
  logo: z.string().url('Logo deve ser uma URL válida').optional(),
  coverImage: z.string().url('Imagem de capa deve ser uma URL válida').optional()
});

const updateStoreSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').optional(),
  phone: z.string().min(10, 'Telefone deve ter no mínimo 10 caracteres').optional(),
  address: z.object({
    street: z.string().min(3, 'Rua deve ter no mínimo 3 caracteres').optional(),
    number: z.string().min(1, 'Número deve ter no mínimo 1 caractere').optional(),
    complement: z.string().optional(),
    neighborhood: z.string().min(3, 'Bairro deve ter no mínimo 3 caracteres').optional(),
    city: z.string().min(3, 'Cidade deve ter no mínimo 3 caracteres').optional(),
    state: z.string().length(2, 'Estado deve ter 2 caracteres (UF)').optional(),
    zipCode: z.string().length(8, 'CEP deve ter 8 caracteres').optional()
  }).optional(),
  deliveryRadius: z.number().min(1, 'Raio de entrega deve ser no mínimo 1 km').optional(),
  estimatedDeliveryTime: z.number().min(15, 'Tempo estimado deve ser no mínimo 15 minutos').optional(),
  minimumOrderValue: z.number().min(0, 'Valor mínimo deve ser 0 ou maior').optional(),
  isOpen: z.boolean().optional(),
  logo: z.string().url('Logo deve ser uma URL válida').optional(),
  coverImage: z.string().url('Imagem de capa deve ser uma URL válida').optional()
});

export const createStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const validatedData = createStoreSchema.parse(req.body);
    const store = await storeService.createStore(req.user.userId, validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Loja criada com sucesso',
      data: { store }
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
    }
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getStoreById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID da loja é obrigatório' });
      return;
    }
    const store = await storeService.getStoreById(id);

    if (!store) {
      res.status(404).json({
        success: false,
        message: 'Loja não encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Loja obtida com sucesso',
      data: { store }
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getMyStores = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const stores = await storeService.getStoresByOwner(req.user.userId);
    
    res.status(200).json({
      success: true,
      message: 'Lojas obtidas com sucesso',
      data: { stores }
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getAllStores = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stores = await storeService.getAllStores();
    
    res.status(200).json({
      success: true,
      message: 'Lojas obtidas com sucesso',
      data: { stores }
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const updateStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID da loja é obrigatório' });
      return;
    }
    const validatedData = updateStoreSchema.parse(req.body);
    const store = await storeService.updateStore(id, req.user!.userId, validatedData);
    
    res.status(200).json({
      success: true,
      message: 'Loja atualizada com sucesso',
      data: { store }
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
    }
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const deleteStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID da loja é obrigatório' });
      return;
    }
    await storeService.deleteStore(id, req.user!.userId);
    
    res.status(200).json({
      success: true,
      message: 'Loja excluída com sucesso'
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const toggleStoreStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID da loja é obrigatório' });
      return;
    }
    const store = await storeService.toggleStoreStatus(id, req.user!.userId);
    
    res.status(200).json({
      success: true,
      message: `Loja ${store.isOpen ? 'aberta' : 'fechada'} com sucesso`,
      data: { store }
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};
