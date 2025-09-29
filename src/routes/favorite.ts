import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { asyncAuthenticatedHandler } from '../middleware/asyncHandler';
import {
  // Favorites CRUD
  createFavorite,
  updateFavorite,
  deleteFavorite,
  getFavoriteById,
  getFavorites,
  
  // Favorite Lists CRUD
  createFavoriteList,
  updateFavoriteList,
  deleteFavoriteList,
  getFavoriteListById,
  getFavoriteLists,
  
  // Statistics & Analytics
  getFavoriteStats,
  getFavoriteAnalytics,
  
  // Recommendations
  getRecommendations,
  
  // Export
  exportFavorites,
  
  // Utility
  toggleFavorite,
  checkFavoriteStatus
} from '../controllers/favoriteController';
import {
  createFavoriteSchema,
  updateFavoriteSchema,
  favoriteFilterSchema,
  createFavoriteListSchema,
  updateFavoriteListSchema,
  favoriteListFilterSchema,
  favoriteIdSchema,
  listIdSchema,
  toggleFavoriteSchema,
  checkFavoriteStatusSchema,
  analyticsQuerySchema,
  exportQuerySchema,
  recommendationsQuerySchema
} from '../schemas/favoriteSchemas';
import { UserRole } from '@prisma/client';

const router = Router();

// ===== FAVORITES ROUTES =====

// Rotas autenticadas
router.use(authenticate);

// CRUD de Favoritos
router.post('/', validateBody(createFavoriteSchema), asyncAuthenticatedHandler(createFavorite));
router.get('/', asyncAuthenticatedHandler(getFavorites));

// Rotas específicas ANTES da rota genérica /:favoriteId
router.get('/stats', asyncAuthenticatedHandler(getFavoriteStats));
router.get('/recommendations', asyncAuthenticatedHandler(getRecommendations));
router.get('/export', asyncAuthenticatedHandler(exportFavorites));
router.get('/analytics', authorize([UserRole.ADMIN]), validateQuery(analyticsQuerySchema), asyncAuthenticatedHandler(getFavoriteAnalytics));

// Toggle favorito (adicionar/remover)
router.post('/toggle/:type/:itemId', validateParams(toggleFavoriteSchema), asyncAuthenticatedHandler(toggleFavorite));

// Verificar status de favorito
router.get('/status/:type/:itemId', validateParams(checkFavoriteStatusSchema), asyncAuthenticatedHandler(checkFavoriteStatus));

// ===== FAVORITE LISTS ROUTES =====

// CRUD de Listas de Favoritos
router.post('/lists', validateBody(createFavoriteListSchema), asyncAuthenticatedHandler(createFavoriteList));
router.get('/lists', asyncAuthenticatedHandler(getFavoriteLists));
router.get('/lists/:listId', validateParams(listIdSchema), asyncAuthenticatedHandler(getFavoriteListById));
router.put('/lists/:listId', validateParams(listIdSchema), validateBody(updateFavoriteListSchema), asyncAuthenticatedHandler(updateFavoriteList));
router.delete('/lists/:listId', validateParams(listIdSchema), asyncAuthenticatedHandler(deleteFavoriteList));

// Rotas genéricas por último
router.get('/:favoriteId', validateParams(favoriteIdSchema), asyncAuthenticatedHandler(getFavoriteById));
router.put('/:favoriteId', validateParams(favoriteIdSchema), validateBody(updateFavoriteSchema), asyncAuthenticatedHandler(updateFavorite));
router.delete('/:favoriteId', validateParams(favoriteIdSchema), asyncAuthenticatedHandler(deleteFavorite));

export default router;
