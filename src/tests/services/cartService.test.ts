import { CartService } from '../../services/cartService';
import { prisma } from '../setup';

describe('CartService', () => {
  let cartService: CartService;
  let testUserId: string;
  let testStoreId: string;
  let testCategoryId: string;
  let testProductId: string;

  beforeEach(async () => {
    cartService = new CartService();
    
    // Limpar dados antes de cada teste
    await prisma.cartItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Criar dados de teste
    const testUser = await prisma.user.create({
      data: {
        email: `test${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'Test User',
        role: 'CLIENT'
      }
    });
    testUserId = testUser.id;

    const testStore = await prisma.store.create({
      data: {
        name: 'Test Store',
        description: 'Test Store Description',
        phone: '11999999999',
        email: `store${Date.now()}@example.com`,
        address: {
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test Neighborhood',
          city: 'Test City',
          state: 'SP',
          zipCode: '01234567'
        },
        deliveryRadius: 5,
        estimatedDeliveryTime: 30,
        minimumOrderValue: 20,
        ownerId: testUserId
      }
    });
    testStoreId = testStore.id;

    const testCategory = await prisma.category.create({
      data: {
        name: `Test Category ${Date.now()}`,
        description: 'Test Category Description'
      }
    });
    testCategoryId = testCategory.id;

    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Test Product Description',
        price: 25.90,
        categoryId: testCategoryId,
        storeId: testStoreId,
        isAvailable: true,
        nutritionalInfo: {}
      }
    });
    testProductId = testProduct.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('getOrCreateCart', () => {
    it('deve criar carrinho quando não existe', async () => {
      const cart = await cartService.getOrCreateCart(testUserId);

      expect(cart).toBeDefined();
      expect(cart.userId).toBe(testUserId);
      expect(cart.items).toHaveLength(0);
      expect(cart.totalItems).toBe(0);
      expect(cart.totalValue).toBe(0);
    });

    it('deve retornar carrinho existente', async () => {
      // Criar carrinho primeiro
      await cartService.getOrCreateCart(testUserId);
      
      // Buscar novamente
      const cart = await cartService.getOrCreateCart(testUserId);

      expect(cart).toBeDefined();
      expect(cart.userId).toBe(testUserId);
    });
  });

  describe('addToCart', () => {
    it('deve adicionar produto ao carrinho', async () => {
      const cartItem = await cartService.addToCart(testUserId, {
        productId: testProductId,
        quantity: 2
      });

      expect(cartItem).toBeDefined();
      expect(cartItem.productId).toBe(testProductId);
      expect(cartItem.quantity).toBe(2);
      expect(cartItem.product.name).toBe('Test Product');
    });

    it('deve aumentar quantidade ao adicionar produto existente', async () => {
      // Adicionar produto primeiro
      await cartService.addToCart(testUserId, {
        productId: testProductId,
        quantity: 2
      });

      // Adicionar novamente
      const cartItem = await cartService.addToCart(testUserId, {
        productId: testProductId,
        quantity: 1
      });

      expect(cartItem.quantity).toBe(3); // 2 + 1
    });

    it('deve falhar ao adicionar produto inexistente', async () => {
      await expect(
        cartService.addToCart(testUserId, {
          productId: 'produto-inexistente',
          quantity: 1
        })
      ).rejects.toThrow('Produto não encontrado');
    });

    it('deve falhar ao adicionar produto indisponível', async () => {
      // Tornar produto indisponível
      await prisma.product.update({
        where: { id: testProductId },
        data: { isAvailable: false }
      });

      await expect(
        cartService.addToCart(testUserId, {
          productId: testProductId,
          quantity: 1
        })
      ).rejects.toThrow('Produto não está disponível');
    });
  });

  describe('updateCartItem', () => {
    let cartItemId: string;

    beforeEach(async () => {
      const cartItem = await cartService.addToCart(testUserId, {
        productId: testProductId,
        quantity: 2
      });
      cartItemId = cartItem.id;
    });

    it('deve atualizar quantidade do item', async () => {
      const updatedItem = await cartService.updateCartItem(testUserId, cartItemId, {
        quantity: 5
      });

      expect(updatedItem.quantity).toBe(5);
    });

    it('deve falhar ao atualizar item inexistente', async () => {
      await expect(
        cartService.updateCartItem(testUserId, 'item-inexistente', {
          quantity: 2
        })
      ).rejects.toThrow('Item não encontrado no carrinho');
    });

    it('deve falhar com quantidade inválida', async () => {
      await expect(
        cartService.updateCartItem(testUserId, cartItemId, {
          quantity: 0
        })
      ).rejects.toThrow('Quantidade deve ser maior que zero');
    });
  });

  describe('removeFromCart', () => {
    let cartItemId: string;

    beforeEach(async () => {
      const cartItem = await cartService.addToCart(testUserId, {
        productId: testProductId,
        quantity: 2
      });
      cartItemId = cartItem.id;
    });

    it('deve remover item do carrinho', async () => {
      await cartService.removeFromCart(testUserId, cartItemId);

      // Verificar se item foi removido
      const cart = await cartService.getOrCreateCart(testUserId);
      expect(cart.items).toHaveLength(0);
    });

    it('deve falhar ao remover item inexistente', async () => {
      await expect(
        cartService.removeFromCart(testUserId, 'item-inexistente')
      ).rejects.toThrow('Item não encontrado no carrinho');
    });
  });

  describe('clearCart', () => {
    beforeEach(async () => {
      // Adicionar alguns itens
      await cartService.addToCart(testUserId, {
        productId: testProductId,
        quantity: 2
      });
    });

    it('deve limpar carrinho completamente', async () => {
      await cartService.clearCart(testUserId);

      const cart = await cartService.getOrCreateCart(testUserId);
      expect(cart.items).toHaveLength(0);
      expect(cart.totalItems).toBe(0);
      expect(cart.totalValue).toBe(0);
    });
  });

  describe('getCartSummary', () => {
    beforeEach(async () => {
      // Adicionar alguns itens
      await cartService.addToCart(testUserId, {
        productId: testProductId,
        quantity: 3
      });
    });

    it('deve calcular resumo do carrinho corretamente', async () => {
      const summary = await cartService.getCartSummary(testUserId);

      expect(summary.totalItems).toBe(3);
      expect(summary.totalValue).toBeCloseTo(77.7, 1); // 3 * 25.90
      expect(summary.itemsCount).toBe(1);
    });
  });
});
