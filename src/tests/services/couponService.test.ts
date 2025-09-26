import { CouponService } from '../../services/couponService';
import { prisma } from '../../config/database';
import { UserRole, CouponType } from '@prisma/client';

describe('CouponService', () => {
  let couponService: CouponService;
  let testUser: any;
  let testStoreOwner: any;
  let testStore: any;

  beforeAll(async () => {
    couponService = new CouponService();
  });

  beforeEach(async () => {
    await prisma.couponUsage.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();

    testUser = await prisma.user.create({
      data: {
        email: 'cliente@test.com',
        password: 'hashedpassword',
        name: 'Cliente Teste',
        role: UserRole.CLIENT
      }
    });

    testStoreOwner = await prisma.user.create({
      data: {
        email: 'dono@test.com',
        password: 'hashedpassword',
        name: 'Dono Teste',
        role: UserRole.STORE_OWNER
      }
    });

    testStore = await prisma.store.create({
      data: {
        name: 'Loja Teste',
        description: 'Loja para testes',
        phone: '11999999999',
        email: 'dono@test.com',
        address: JSON.stringify({
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567'
        }),
        deliveryRadius: 5,
        estimatedDeliveryTime: 30,
        minimumOrderValue: 25,
        isOpen: true,
        ownerId: testStoreOwner.id
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createCoupon', () => {
    it('deve criar cupom com sucesso', async () => {
      const couponData = {
        code: 'DESCONTO10',
        type: CouponType.PERCENTAGE,
        value: 10,
        minOrderValue: 50,
        maxUses: 100,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31')
      };

      const coupon = await couponService.createCoupon(couponData);

      expect(coupon).toBeDefined();
      expect(coupon.code).toBe('DESCONTO10');
      expect(coupon.type).toBe(CouponType.PERCENTAGE);
      expect(coupon.value).toBe(10);
      expect(coupon.minOrderValue).toBe(50);
      expect(coupon.maxUses).toBe(100);
      expect(coupon.usedCount).toBe(0);
      expect(coupon.isActive).toBe(true);
    });

    it('deve criar cupom sem campos opcionais', async () => {
      const couponData = {
        code: 'SIMPLES',
        type: CouponType.FIXED,
        value: 5,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31')
      };

      const coupon = await couponService.createCoupon(couponData);

      expect(coupon.code).toBe('SIMPLES');
      expect(coupon.minOrderValue).toBeNull();
      expect(coupon.maxUses).toBeNull();
      expect(coupon.storeId).toBeNull();
    });

    it('deve falhar ao criar cupom com código duplicado', async () => {
      const couponData = {
        code: 'DUPLICADO',
        type: CouponType.PERCENTAGE,
        value: 10,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31')
      };

      await couponService.createCoupon(couponData);

      await expect(couponService.createCoupon(couponData))
        .rejects.toThrow('Código de cupom já existe');
    });

    it('deve falhar com data inválida', async () => {
      const couponData = {
        code: 'DATAINVALIDA',
        type: CouponType.PERCENTAGE,
        value: 10,
        validFrom: new Date('2024-12-31'),
        validUntil: new Date('2024-01-01')
      };

      await expect(couponService.createCoupon(couponData))
        .rejects.toThrow('Data de início deve ser anterior à data de fim');
    });

    it('deve falhar com loja inexistente', async () => {
      const couponData = {
        code: 'LOJAINEXISTENTE',
        type: CouponType.PERCENTAGE,
        value: 10,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        storeId: 'loja-inexistente'
      };

      await expect(couponService.createCoupon(couponData))
        .rejects.toThrow('Loja não encontrada');
    });
  });

  describe('getAllCoupons', () => {
    beforeEach(async () => {
      await prisma.coupon.createMany({
        data: [
          {
            code: 'CUPOM1',
            type: CouponType.PERCENTAGE,
            value: 10,
            validFrom: new Date('2024-01-01'),
            validUntil: new Date('2024-12-31')
          },
          {
            code: 'CUPOM2',
            type: CouponType.FIXED,
            value: 5,
            validFrom: new Date('2024-01-01'),
            validUntil: new Date('2024-12-31'),
            storeId: testStore.id
          }
        ]
      });
    });

    it('deve retornar todos os cupons', async () => {
      const result = await couponService.getAllCoupons(1, 10);

      expect(result.coupons).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('deve filtrar cupons por loja', async () => {
      const result = await couponService.getAllCoupons(1, 10, testStore.id);

      expect(result.coupons).toHaveLength(1);
      expect(result.coupons[0]?.storeId).toBe(testStore.id);
    });
  });

  describe('getActiveCoupons', () => {
    beforeEach(async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await prisma.coupon.createMany({
        data: [
          {
            code: 'ATIVO',
            type: CouponType.PERCENTAGE,
            value: 10,
            validFrom: past,
            validUntil: future,
            isActive: true
          },
          {
            code: 'INATIVO',
            type: CouponType.PERCENTAGE,
            value: 10,
            validFrom: past,
            validUntil: future,
            isActive: false
          },
          {
            code: 'EXPIRADO',
            type: CouponType.PERCENTAGE,
            value: 10,
            validFrom: new Date('2023-01-01'),
            validUntil: new Date('2023-12-31'),
            isActive: true
          }
        ]
      });
    });

    it('deve retornar apenas cupons ativos e válidos', async () => {
      const coupons = await couponService.getActiveCoupons();

      expect(coupons).toHaveLength(1);
      expect(coupons[0]?.code).toBe('ATIVO');
    });
  });

  describe('getCouponById', () => {
    let testCoupon: any;

    beforeEach(async () => {
      testCoupon = await prisma.coupon.create({
        data: {
          code: 'TESTE',
          type: CouponType.PERCENTAGE,
          value: 10,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31')
        }
      });
    });

    it('deve retornar cupom quando encontrado', async () => {
      const coupon = await couponService.getCouponById(testCoupon.id);

      expect(coupon.id).toBe(testCoupon.id);
      expect(coupon.code).toBe('TESTE');
    });

    it('deve falhar ao buscar cupom inexistente', async () => {
      await expect(couponService.getCouponById('cupom-inexistente'))
        .rejects.toThrow('Cupom não encontrado');
    });
  });

  describe('getCouponByCode', () => {
    beforeEach(async () => {
      await prisma.coupon.create({
        data: {
          code: 'CODIGO123',
          type: CouponType.PERCENTAGE,
          value: 10,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31')
        }
      });
    });

    it('deve retornar cupom quando encontrado', async () => {
      const coupon = await couponService.getCouponByCode('CODIGO123');

      expect(coupon.code).toBe('CODIGO123');
    });

    it('deve retornar cupom com código em minúscula', async () => {
      const coupon = await couponService.getCouponByCode('codigo123');

      expect(coupon.code).toBe('CODIGO123');
    });

    it('deve falhar ao buscar cupom inexistente', async () => {
      await expect(couponService.getCouponByCode('INEXISTENTE'))
        .rejects.toThrow('Cupom não encontrado');
    });
  });

  describe('updateCoupon', () => {
    let testCoupon: any;

    beforeEach(async () => {
      testCoupon = await prisma.coupon.create({
        data: {
          code: 'ORIGINAL',
          type: CouponType.PERCENTAGE,
          value: 10,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31')
        }
      });
    });

    it('deve atualizar cupom com sucesso', async () => {
      const updateData = {
        code: 'ATUALIZADO',
        value: 15,
        isActive: false
      };

      const updatedCoupon = await couponService.updateCoupon(testCoupon.id, updateData);

      expect(updatedCoupon.code).toBe('ATUALIZADO');
      expect(updatedCoupon.value).toBe(15);
      expect(updatedCoupon.isActive).toBe(false);
    });

    it('deve falhar ao atualizar cupom inexistente', async () => {
      await expect(couponService.updateCoupon('inexistente', { code: 'NOVO' }))
        .rejects.toThrow('Cupom não encontrado');
    });

    it('deve falhar ao atualizar para código duplicado', async () => {
      await prisma.coupon.create({
        data: {
          code: 'DUPLICADO',
          type: CouponType.PERCENTAGE,
          value: 10,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31')
        }
      });

      await expect(couponService.updateCoupon(testCoupon.id, { code: 'DUPLICADO' }))
        .rejects.toThrow('Código de cupom já existe');
    });
  });

  describe('deleteCoupon', () => {
    let testCoupon: any;

    beforeEach(async () => {
      testCoupon = await prisma.coupon.create({
        data: {
          code: 'PARAEXCLUIR',
          type: CouponType.PERCENTAGE,
          value: 10,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31')
        }
      });
    });

    it('deve excluir cupom com sucesso', async () => {
      await couponService.deleteCoupon(testCoupon.id);

      await expect(couponService.getCouponById(testCoupon.id))
        .rejects.toThrow('Cupom não encontrado');
    });

    it('deve falhar ao excluir cupom inexistente', async () => {
      await expect(couponService.deleteCoupon('inexistente'))
        .rejects.toThrow('Cupom não encontrado');
    });
  });

  describe('validateCoupon', () => {
    let activeCoupon: any;
    let expiredCoupon: any;
    let inactiveCoupon: any;
    let storeCoupon: any;

    beforeEach(async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      activeCoupon = await prisma.coupon.create({
        data: {
          code: 'VALIDO',
          type: CouponType.PERCENTAGE,
          value: 10,
          minOrderValue: 50,
          validFrom: past,
          validUntil: future,
          isActive: true
        }
      });

      expiredCoupon = await prisma.coupon.create({
        data: {
          code: 'EXPIRADO',
          type: CouponType.PERCENTAGE,
          value: 10,
          validFrom: new Date('2023-01-01'),
          validUntil: new Date('2023-12-31'),
          isActive: true
        }
      });

      inactiveCoupon = await prisma.coupon.create({
        data: {
          code: 'INATIVO',
          type: CouponType.PERCENTAGE,
          value: 10,
          validFrom: past,
          validUntil: future,
          isActive: false
        }
      });

      storeCoupon = await prisma.coupon.create({
        data: {
          code: 'LOJA',
          type: CouponType.FIXED,
          value: 5,
          validFrom: past,
          validUntil: future,
          isActive: true,
          storeId: testStore.id
        }
      });
    });

    it('deve validar cupom ativo com sucesso', async () => {
      const result = await couponService.validateCoupon({
        code: 'VALIDO',
        orderValue: 100
      });

      expect(result.isValid).toBe(true);
      expect(result.discount).toBe(10);
      expect(result.coupon?.code).toBe('VALIDO');
      expect(result.error).toBeUndefined();
    });

    it('deve falhar com cupom inativo', async () => {
      const result = await couponService.validateCoupon({
        code: 'INATIVO',
        orderValue: 100
      });

      expect(result.isValid).toBe(false);
      expect(result.discount).toBe(0);
      expect(result.error).toBe('Cupom inativo');
    });

    it('deve falhar com cupom expirado', async () => {
      const result = await couponService.validateCoupon({
        code: 'EXPIRADO',
        orderValue: 100
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Cupom expirado');
    });

    it('deve falhar com valor abaixo do mínimo', async () => {
      const result = await couponService.validateCoupon({
        code: 'VALIDO',
        orderValue: 30
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Valor mínimo do pedido é R$ 50');
    });

    it('deve validar cupom da loja correta', async () => {
      const result = await couponService.validateCoupon({
        code: 'LOJA',
        orderValue: 50,
        storeId: testStore.id
      });

      expect(result.isValid).toBe(true);
      expect(result.discount).toBe(5);
    });

    it('deve falhar com cupom da loja errada', async () => {
      const result = await couponService.validateCoupon({
        code: 'LOJA',
        orderValue: 50,
        storeId: 'outra-loja'
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Cupom não válido para esta loja');
    });

    it('deve calcular desconto de cupom fixo', async () => {
      const result = await couponService.validateCoupon({
        code: 'LOJA',
        orderValue: 50,
        storeId: testStore.id
      });

      expect(result.discount).toBe(5);
    });

    it('deve calcular desconto de frete grátis', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await prisma.coupon.create({
        data: {
          code: 'FRETEGRATIS',
          type: CouponType.FREE_DELIVERY,
          value: 0,
          validFrom: past,
          validUntil: future,
          isActive: true
        }
      });

      const result = await couponService.validateCoupon({
        code: 'FRETEGRATIS',
        orderValue: 50
      });

      expect(result.isValid).toBe(true);
      expect(result.discount).toBe(5.0);
    });
  });

  describe('useCoupon', () => {
    let testCoupon: any;

    beforeEach(async () => {
      testCoupon = await prisma.coupon.create({
        data: {
          code: 'TESTEUSO',
          type: CouponType.PERCENTAGE,
          value: 10,
          usedCount: 0,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31')
        }
      });
    });

    it('deve registrar uso do cupom', async () => {
      const testOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          storeId: testStore.id,
          addressId: (await prisma.address.create({
            data: {
              userId: testUser.id,
              street: 'Rua Teste',
              number: '123',
              neighborhood: 'Centro',
              city: 'São Paulo',
              state: 'SP',
              zipCode: '01234567'
            }
          })).id,
          status: 'PENDING',
          total: 50,
          deliveryFee: 5,
          subtotal: 45,
          paymentMethod: 'PIX'
        }
      });

      await couponService.useCoupon(testCoupon.id, testUser.id, testOrder.id, 10);

      const updatedCoupon = await couponService.getCouponById(testCoupon.id);
      expect(updatedCoupon.usedCount).toBe(1);

      const usage = await prisma.couponUsage.findFirst({
        where: { couponId: testCoupon.id }
      });
      expect(usage).toBeDefined();
      expect(usage?.userId).toBe(testUser.id);
      expect(usage?.orderId).toBe(testOrder.id);
    });
  });

  describe('getStoreCoupons', () => {
    beforeEach(async () => {
      await prisma.coupon.createMany({
        data: [
          {
            code: 'GLOBAL',
            type: CouponType.PERCENTAGE,
            value: 10,
            validFrom: new Date('2024-01-01'),
            validUntil: new Date('2024-12-31')
          },
          {
            code: 'LOJA1',
            type: CouponType.FIXED,
            value: 5,
            validFrom: new Date('2024-01-01'),
            validUntil: new Date('2024-12-31'),
            storeId: testStore.id
          }
        ]
      });
    });

    it('deve retornar cupons da loja para o dono', async () => {
      const result = await couponService.getStoreCoupons(testStore.id, testStoreOwner.id, 1, 10);

      expect(result.coupons).toHaveLength(1);
      expect(result.coupons[0]?.code).toBe('LOJA1');
    });

    it('deve falhar para usuário que não é dono da loja', async () => {
      await expect(couponService.getStoreCoupons(testStore.id, 'outro-usuario', 1, 10))
        .rejects.toThrow('Loja não encontrada ou não pertence ao usuário');
    });
  });

  describe('createStoreCoupon', () => {
    it('deve criar cupom para loja específica', async () => {
      const couponData = {
        code: 'CUPOMDALOJA',
        type: CouponType.PERCENTAGE,
        value: 15,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31')
      };

      const coupon = await couponService.createStoreCoupon(testStore.id, testStoreOwner.id, couponData);

      expect(coupon.code).toBe('CUPOMDALOJA');
      expect(coupon.storeId).toBe(testStore.id);
    });

    it('deve falhar para usuário que não é dono da loja', async () => {
      const couponData = {
        code: 'CUPOMDALOJA',
        type: CouponType.PERCENTAGE,
        value: 15,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31')
      };

      await expect(couponService.createStoreCoupon(testStore.id, 'outro-usuario', couponData))
        .rejects.toThrow('Loja não encontrada ou não pertence ao usuário');
    });
  });
});
