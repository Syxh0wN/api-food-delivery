import { prisma } from '../config/database';
import { CreateCouponInput, UpdateCouponInput, CouponResponse, CouponListResponse, ValidateCouponInput, ValidateCouponResponse } from '../types/coupon';
import { CouponType } from '@prisma/client';

export class CouponService {
  async createCoupon(data: CreateCouponInput): Promise<CouponResponse> {
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: data.code }
    });

    if (existingCoupon) {
      throw new Error('Código de cupom já existe');
    }

    if (data.storeId) {
      const store = await prisma.store.findUnique({
        where: { id: data.storeId }
      });
      if (!store) {
        throw new Error('Loja não encontrada');
      }
    }

    if (data.validFrom >= data.validUntil) {
      throw new Error('Data de início deve ser anterior à data de fim');
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        minOrderValue: data.minOrderValue || null,
        maxUses: data.maxUses || null,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        storeId: data.storeId || null
      },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      ...coupon,
      value: Number(coupon.value),
      minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null
    } as CouponResponse;
  }

  async getAllCoupons(page: number = 1, limit: number = 10, storeId?: string): Promise<CouponListResponse> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (storeId) {
      where.storeId = storeId;
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        include: {
          store: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.coupon.count({ where })
    ]);

    return {
      coupons: coupons.map(coupon => ({
        ...coupon,
        value: Number(coupon.value),
        minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null
      })) as CouponResponse[],
      total,
      page,
      limit
    };
  }

  async getActiveCoupons(storeId?: string): Promise<CouponResponse[]> {
    const now = new Date();
    const where: any = {
      isActive: true,
      validFrom: { lte: now },
      validUntil: { gte: now }
    };

    if (storeId) {
      where.OR = [
        { storeId: storeId },
        { storeId: null }
      ];
    } else {
      where.storeId = null;
    }

    const coupons = await prisma.coupon.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return coupons.map(coupon => ({
      ...coupon,
      value: Number(coupon.value),
      minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null
    })) as CouponResponse[];
  }

  async getCouponById(couponId: string): Promise<CouponResponse> {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!coupon) {
      throw new Error('Cupom não encontrado');
    }

    return {
      ...coupon,
      value: Number(coupon.value),
      minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null
    } as CouponResponse;
  }

  async getCouponByCode(code: string): Promise<CouponResponse> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!coupon) {
      throw new Error('Cupom não encontrado');
    }

    return {
      ...coupon,
      value: Number(coupon.value),
      minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null
    } as CouponResponse;
  }

  async updateCoupon(couponId: string, data: UpdateCouponInput): Promise<CouponResponse> {
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: couponId }
    });

    if (!existingCoupon) {
      throw new Error('Cupom não encontrado');
    }

    if (data.code && data.code !== existingCoupon.code) {
      const codeConflict = await prisma.coupon.findUnique({
        where: { code: data.code.toUpperCase() }
      });
      if (codeConflict) {
        throw new Error('Código de cupom já existe');
      }
    }

    if (data.validFrom && data.validUntil && data.validFrom >= data.validUntil) {
      throw new Error('Data de início deve ser anterior à data de fim');
    }

    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.minOrderValue !== undefined) updateData.minOrderValue = data.minOrderValue;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.validFrom !== undefined) updateData.validFrom = data.validFrom;
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: updateData,
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      ...updatedCoupon,
      value: Number(updatedCoupon.value),
      minOrderValue: updatedCoupon.minOrderValue ? Number(updatedCoupon.minOrderValue) : null
    } as CouponResponse;
  }

  async deleteCoupon(couponId: string): Promise<void> {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId }
    });

    if (!coupon) {
      throw new Error('Cupom não encontrado');
    }

    await prisma.coupon.delete({
      where: { id: couponId }
    });
  }

  async validateCoupon(data: ValidateCouponInput): Promise<ValidateCouponResponse> {
    try {
      const coupon = await this.getCouponByCode(data.code);
      const now = new Date();

      if (!coupon.isActive) {
        return {
          isValid: false,
          discount: 0,
          coupon: null,
          error: 'Cupom inativo'
        };
      }

      if (now < coupon.validFrom) {
        return {
          isValid: false,
          discount: 0,
          coupon: null,
          error: 'Cupom ainda não está válido'
        };
      }

      if (now > coupon.validUntil) {
        return {
          isValid: false,
          discount: 0,
          coupon: null,
          error: 'Cupom expirado'
        };
      }

      if (coupon.storeId && data.storeId && coupon.storeId !== data.storeId) {
        return {
          isValid: false,
          discount: 0,
          coupon: null,
          error: 'Cupom não válido para esta loja'
        };
      }

      if (coupon.minOrderValue && data.orderValue < coupon.minOrderValue) {
        return {
          isValid: false,
          discount: 0,
          coupon: null,
          error: `Valor mínimo do pedido é R$ ${coupon.minOrderValue}`
        };
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return {
          isValid: false,
          discount: 0,
          coupon: null,
          error: 'Cupom atingiu o limite de uso'
        };
      }

      let discount = 0;
      switch (coupon.type) {
        case CouponType.PERCENTAGE:
          discount = (data.orderValue * coupon.value) / 100;
          break;
        case CouponType.FIXED:
          discount = coupon.value;
          break;
        case CouponType.FREE_DELIVERY:
          discount = 5.0;
          break;
      }

      discount = Math.min(discount, data.orderValue);

      return {
        isValid: true,
        discount,
        coupon,
        error: undefined
      };
    } catch (error: any) {
      return {
        isValid: false,
        discount: 0,
        coupon: null,
        error: error.message
      };
    }
  }

  async useCoupon(couponId: string, userId: string, orderId: string, discountApplied: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } }
      });

      await tx.couponUsage.create({
        data: {
          couponId,
          userId,
          orderId,
          discountApplied
        }
      });
    });
  }

  async getCouponUsage(couponId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [usages, total] = await Promise.all([
      prisma.couponUsage.findMany({
        where: { couponId },
        include: {
          coupon: {
            select: {
              code: true,
              type: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              total: true
            }
          }
        },
        orderBy: { usedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.couponUsage.count({ where: { couponId } })
    ]);

    return {
      usages: usages.map(usage => ({
        ...usage,
        discountApplied: Number(usage.discountApplied),
        order: {
          ...usage.order,
          total: Number(usage.order.total)
        }
      })),
      total,
      page,
      limit
    };
  }

  async getStoreCoupons(storeId: string, userId: string, page: number = 1, limit: number = 10): Promise<CouponListResponse> {
    const store = await prisma.store.findFirst({
      where: { id: storeId, ownerId: userId }
    });

    if (!store) {
      throw new Error('Loja não encontrada ou não pertence ao usuário');
    }

    return this.getAllCoupons(page, limit, storeId);
  }

  async createStoreCoupon(storeId: string, userId: string, data: CreateCouponInput): Promise<CouponResponse> {
    const store = await prisma.store.findFirst({
      where: { id: storeId, ownerId: userId }
    });

    if (!store) {
      throw new Error('Loja não encontrada ou não pertence ao usuário');
    }

    return this.createCoupon({ ...data, storeId });
  }
}
