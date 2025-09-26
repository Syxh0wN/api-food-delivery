import { CouponType } from '@prisma/client';

export interface CreateCouponInput {
  code: string;
  type: CouponType;
  value: number;
  minOrderValue?: number | undefined;
  maxUses?: number | undefined;
  validFrom: Date;
  validUntil: Date;
  storeId?: string | undefined;
}

export interface UpdateCouponInput {
  code?: string | undefined;
  type?: CouponType | undefined;
  value?: number | undefined;
  minOrderValue?: number | undefined;
  maxUses?: number | undefined;
  validFrom?: Date | undefined;
  validUntil?: Date | undefined;
  isActive?: boolean | undefined;
}

export interface CouponResponse {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  storeId: string | null;
  createdAt: Date;
  store?: {
    id: string;
    name: string;
  };
}

export interface CouponListResponse {
  coupons: CouponResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ValidateCouponInput {
  code: string;
  orderValue: number;
  storeId?: string | undefined;
}

export interface ValidateCouponResponse {
  isValid: boolean;
  discount: number;
  coupon: CouponResponse | null;
  error?: string | undefined;
}

export interface CouponUsageResponse {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  discountApplied: number;
  usedAt: Date;
  coupon: {
    code: string;
    type: CouponType;
  };
  order: {
    id: string;
    total: number;
  };
}
