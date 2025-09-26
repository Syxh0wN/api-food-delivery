import { Response, Request } from 'express';
import { CouponService } from '../services/couponService';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { UserRole, CouponType } from '@prisma/client';

const couponService = new CouponService();

const createCouponSchema = z.object({
  code: z.string().min(3, 'Código deve ter no mínimo 3 caracteres').max(20, 'Código deve ter no máximo 20 caracteres'),
  type: z.nativeEnum(CouponType),
  value: z.number().min(0.01, 'Valor deve ser maior que zero'),
  minOrderValue: z.number().min(0, 'Valor mínimo deve ser positivo').optional(),
  maxUses: z.number().int().min(1, 'Limite de uso deve ser pelo menos 1').optional(),
  validFrom: z.string().transform((str) => new Date(str)),
  validUntil: z.string().transform((str) => new Date(str)),
  storeId: z.string().cuid('ID da loja inválido').optional(),
});

const updateCouponSchema = z.object({
  code: z.string().min(3, 'Código deve ter no mínimo 3 caracteres').max(20, 'Código deve ter no máximo 20 caracteres').optional(),
  type: z.nativeEnum(CouponType).optional(),
  value: z.number().min(0.01, 'Valor deve ser maior que zero').optional(),
  minOrderValue: z.number().min(0, 'Valor mínimo deve ser positivo').optional(),
  maxUses: z.number().int().min(1, 'Limite de uso deve ser pelo menos 1').optional(),
  validFrom: z.string().transform((str) => new Date(str)).optional(),
  validUntil: z.string().transform((str) => new Date(str)).optional(),
  isActive: z.boolean().optional(),
});

const validateCouponSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  orderValue: z.number().min(0.01, 'Valor do pedido deve ser maior que zero'),
  storeId: z.string().cuid('ID da loja inválido').optional(),
});

export const createCoupon = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.STORE_OWNER) {
      res.status(403).json({ 
        success: false,
        message: 'Acesso negado: Apenas donos de loja podem criar cupons' 
      });
      return;
    }

    const validatedData = createCouponSchema.parse(req.body);
    const newCoupon = await couponService.createCoupon(validatedData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Cupom criado com sucesso', 
      data: { coupon: newCoupon } 
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

export const getAllCoupons = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const storeId = req.query.storeId as string;
    
    const result = await couponService.getAllCoupons(page, limit, storeId);
    
    res.status(200).json({ 
      success: true, 
      message: 'Cupons obtidos com sucesso', 
      data: result 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getActiveCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const storeId = req.query.storeId as string;
    const coupons = await couponService.getActiveCoupons(storeId);
    
    res.status(200).json({ 
      success: true, 
      message: 'Cupons ativos obtidos com sucesso', 
      data: { coupons } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCouponById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID do cupom é obrigatório' });
      return;
    }

    const coupon = await couponService.getCouponById(id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Cupom obtido com sucesso', 
      data: { coupon } 
    });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const getCouponByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    if (!code) {
      res.status(400).json({ success: false, message: 'Código do cupom é obrigatório' });
      return;
    }

    const coupon = await couponService.getCouponByCode(code);
    
    res.status(200).json({ 
      success: true, 
      message: 'Cupom obtido com sucesso', 
      data: { coupon } 
    });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateCoupon = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.STORE_OWNER) {
      res.status(403).json({ 
        success: false,
        message: 'Acesso negado: Apenas donos de loja podem atualizar cupons' 
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID do cupom é obrigatório' });
      return;
    }

    const validatedData = updateCouponSchema.parse(req.body);
    const updatedCoupon = await couponService.updateCoupon(id, validatedData);
    
    res.status(200).json({ 
      success: true, 
      message: 'Cupom atualizado com sucesso', 
      data: { coupon: updatedCoupon } 
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

export const deleteCoupon = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.STORE_OWNER) {
      res.status(403).json({ 
        success: false,
        message: 'Acesso negado: Apenas donos de loja podem excluir cupons' 
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID do cupom é obrigatório' });
      return;
    }

    await couponService.deleteCoupon(id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Cupom excluído com sucesso' 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const validateCoupon = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = validateCouponSchema.parse(req.body);
    const result = await couponService.validateCoupon(validatedData);
    
    res.status(200).json({ 
      success: true, 
      message: 'Validação de cupom realizada', 
      data: result 
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

export const getCouponUsage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.STORE_OWNER) {
      res.status(403).json({ 
        success: false,
        message: 'Acesso negado: Apenas donos de loja podem ver uso dos cupons' 
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID do cupom é obrigatório' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await couponService.getCouponUsage(id, page, limit);
    
    res.status(200).json({ 
      success: true, 
      message: 'Histórico de uso do cupom obtido com sucesso', 
      data: result 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStoreCoupons = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.STORE_OWNER) {
      res.status(403).json({ 
        success: false,
        message: 'Acesso negado: Apenas donos de loja podem ver cupons da loja' 
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
    
    const result = await couponService.getStoreCoupons(storeId, req.user.userId, page, limit);
    
    res.status(200).json({ 
      success: true, 
      message: 'Cupons da loja obtidos com sucesso', 
      data: result 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createStoreCoupon = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.STORE_OWNER) {
      res.status(403).json({ 
        success: false,
        message: 'Acesso negado: Apenas donos de loja podem criar cupons' 
      });
      return;
    }

    const { storeId } = req.params;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'ID da loja é obrigatório' });
      return;
    }

    const validatedData = createCouponSchema.parse(req.body);
    const newCoupon = await couponService.createStoreCoupon(storeId, req.user.userId, validatedData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Cupom da loja criado com sucesso', 
      data: { coupon: newCoupon } 
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
