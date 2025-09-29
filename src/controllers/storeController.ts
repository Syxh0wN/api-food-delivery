import { Response } from 'express';
import { StoreService } from '../services/storeService';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendNotFound } from '../middleware/errorHandler';
import { invalidateStoreCache } from '../middleware/cache';
import { CreateStoreInput, UpdateStoreInput } from '../schemas/storeSchemas';

const storeService = new StoreService();

export const createStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const validatedData = req.body as CreateStoreInput;
  const store = await storeService.createStore(req.user.id, validatedData);
  
  await invalidateStoreCache();
  sendSuccess(res, 'Loja criada com sucesso', { store }, 201);
};

export const getStoreById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const store = await storeService.getStoreById(id);

  if (!store) {
    sendNotFound(res, 'Loja não encontrada');
    return;
  }

  sendSuccess(res, 'Loja obtida com sucesso', { store });
};

export const getMyStores = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const stores = await storeService.getStoresByOwner(req.user.id);
  sendSuccess(res, 'Lojas obtidas com sucesso', { stores });
};

export const getAllStores = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stores = await storeService.getAllStores();
  sendSuccess(res, 'Lojas obtidas com sucesso', { stores });
};

export const updateStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { id } = req.params as { id: string };
  const validatedData = req.body as UpdateStoreInput;
  const store = await storeService.updateStore(id, req.user.id, validatedData);
  
  await invalidateStoreCache(id);
  sendSuccess(res, 'Loja atualizada com sucesso', { store });
};

export const deleteStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { id } = req.params as { id: string };
  await storeService.deleteStore(id, req.user.id);
  
  await invalidateStoreCache(id);
  sendSuccess(res, 'Loja excluída com sucesso');
};

export const toggleStoreStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { id } = req.params as { id: string };
  const store = await storeService.toggleStoreStatus(id, req.user.id);
  
  const message = `Loja ${store.isOpen ? 'aberta' : 'fechada'} com sucesso`;
  sendSuccess(res, message, { store });
};
