import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  createCoupon,
  getAllCoupons,
  getActiveCoupons,
  getCouponById,
  getCouponByCode,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getCouponUsage,
  getStoreCoupons,
  createStoreCoupon
} from '../controllers/couponController';

const router = Router();

// Rotas públicas (para visualizar cupons ativos)
router.get('/coupons/active', getActiveCoupons);
router.get('/coupons/code/:code', getCouponByCode);

// Validar cupom (qualquer usuário autenticado)
router.post('/coupons/validate', authenticate, validateCoupon);

// Rotas que requerem autenticação e autorização de dono de loja
router.use(authenticate);
router.use(authorize([UserRole.STORE_OWNER]));

// CRUD de cupons globais (apenas donos de loja)
router.post('/coupons', createCoupon);
router.get('/coupons', getAllCoupons);
router.get('/coupons/:id', getCouponById);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.get('/coupons/:id/usage', getCouponUsage);

// CRUD de cupons por loja
router.post('/stores/:storeId/coupons', createStoreCoupon);
router.get('/stores/:storeId/coupons', getStoreCoupons);

export default router;
