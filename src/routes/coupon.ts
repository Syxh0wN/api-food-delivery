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

// CRUD de cupons globais (apenas donos de loja)
router.post('/coupons', authenticate, authorize([UserRole.STORE_OWNER]), createCoupon);
router.get('/coupons', authenticate, authorize([UserRole.STORE_OWNER]), getAllCoupons);
router.get('/coupons/:id', authenticate, authorize([UserRole.STORE_OWNER]), getCouponById);
router.put('/coupons/:id', authenticate, authorize([UserRole.STORE_OWNER]), updateCoupon);
router.delete('/coupons/:id', authenticate, authorize([UserRole.STORE_OWNER]), deleteCoupon);
router.get('/coupons/:id/usage', authenticate, authorize([UserRole.STORE_OWNER]), getCouponUsage);

// CRUD de cupons por loja
router.post('/stores/:storeId/coupons', authenticate, authorize([UserRole.STORE_OWNER]), createStoreCoupon);
router.get('/stores/:storeId/coupons', authenticate, authorize([UserRole.STORE_OWNER]), getStoreCoupons);

export default router;
