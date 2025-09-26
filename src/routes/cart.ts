import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary
} from '../controllers/cartController';

const router = Router();

// Todas as rotas do carrinho requerem autenticação
router.use(authenticate);

// Rotas do carrinho
router.get('/cart', getCart);
router.post('/cart/items', addToCart);
router.put('/cart/items/:itemId', updateCartItem);
router.delete('/cart/items/:itemId', removeFromCart);
router.delete('/cart', clearCart);
router.get('/cart/summary', getCartSummary);

export default router;
