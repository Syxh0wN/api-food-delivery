import { Router } from 'express';
import { 
  createProduct,
  getProductById,
  getProductsByStore,
  getAllProducts,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';
import { cacheProductMiddleware, cacheCategoryMiddleware } from '../middleware/cache';

const router = Router();

// Rotas públicas
router.get('/products', cacheProductMiddleware, getAllProducts);
router.get('/products/category/:categoryId', cacheProductMiddleware, getProductsByCategory);
router.get('/products/:id', cacheProductMiddleware, getProductById);
router.get('/stores/:storeId/products', cacheProductMiddleware, getProductsByStore);
router.get('/categories', cacheCategoryMiddleware, getAllCategories);
router.get('/categories/:id', cacheCategoryMiddleware, getCategoryById);

// Rotas para donos de loja - gerenciar produtos
router.post('/stores/:storeId/products', authenticate, authorize(['STORE_OWNER']), createProduct);
router.put('/stores/:storeId/products/:id', authenticate, authorize(['STORE_OWNER']), updateProduct);
router.delete('/stores/:storeId/products/:id', authenticate, authorize(['STORE_OWNER']), deleteProduct);
router.patch('/stores/:storeId/products/:id/toggle', authenticate, authorize(['STORE_OWNER']), toggleProductAvailability);

// Rotas para administração - gerenciar categorias (apenas STORE_OWNER por enquanto)
router.post('/categories', authenticate, authorize(['STORE_OWNER']), createCategory);
router.put('/categories/:id', authenticate, authorize(['STORE_OWNER']), updateCategory);
router.delete('/categories/:id', authenticate, authorize(['STORE_OWNER']), deleteCategory);

export default router;
