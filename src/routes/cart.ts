import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { asyncAuthenticatedHandler } from '../middleware/asyncHandler';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary
} from '../controllers/cartController';
import {
  addToCartSchema,
  updateCartItemSchema,
  itemIdSchema
} from '../schemas/cartSchemas';

const router = Router();

// Todas as rotas do carrinho requerem autenticação
router.use(authenticate);

// Rotas do carrinho
router.get('/', asyncAuthenticatedHandler(getCart));
router.post('/items', validateBody(addToCartSchema), asyncAuthenticatedHandler(addToCart));
router.put('/items/:itemId', validateParams(itemIdSchema), validateBody(updateCartItemSchema), asyncAuthenticatedHandler(updateCartItem));
router.delete('/items/:itemId', validateParams(itemIdSchema), asyncAuthenticatedHandler(removeFromCart));
router.delete('/', asyncAuthenticatedHandler(clearCart));
router.get('/summary', asyncAuthenticatedHandler(getCartSummary));

export default router;
