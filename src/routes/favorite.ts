import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
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
import { UserRole } from '@prisma/client';

const router = Router();

// ===== FAVORITES ROUTES =====

// Rotas autenticadas
router.use(authenticate);

// CRUD de Favoritos
router.post('/', createFavorite);
router.get('/', getFavorites);
router.get('/:favoriteId', getFavoriteById);
router.put('/:favoriteId', updateFavorite);
router.delete('/:favoriteId', deleteFavorite);

// Toggle favorito (adicionar/remover)
router.post('/toggle/:type/:itemId', toggleFavorite);

// Verificar status de favorito
router.get('/status/:type/:itemId', checkFavoriteStatus);

// ===== FAVORITE LISTS ROUTES =====

// CRUD de Listas de Favoritos
router.post('/lists', createFavoriteList);
router.get('/lists', getFavoriteLists);
router.get('/lists/:listId', getFavoriteListById);
router.put('/lists/:listId', updateFavoriteList);
router.delete('/lists/:listId', deleteFavoriteList);

// ===== STATISTICS & ANALYTICS ROUTES =====

// Estatísticas (públicas para usuários logados)
router.get('/stats', getFavoriteStats);

// Análises (apenas admin)
router.get('/analytics', authorize([UserRole.ADMIN]), getFavoriteAnalytics);

// ===== RECOMMENDATIONS ROUTES =====

// Recomendações baseadas em favoritos
router.get('/recommendations', getRecommendations);

// ===== EXPORT ROUTES =====

// Exportar favoritos
router.get('/export', exportFavorites);

export default router;
