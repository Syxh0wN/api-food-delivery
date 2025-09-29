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
import { validateBody, validateParams } from '../middleware/validation';
import { asyncHandler, asyncAuthenticatedHandler } from '../middleware/asyncHandler';
import { 
  createProductSchema, 
  updateProductSchema, 
  createCategorySchema, 
  updateCategorySchema,
  productIdSchema,
  storeIdSchema,
  categoryIdSchema,
  storeProductIdSchema,
  categoryIdParamSchema
} from '../schemas/productSchemas';

const router = Router();

// Rotas públicas
router.get('/products', cacheProductMiddleware, asyncHandler(getAllProducts));
router.get('/products/category/:categoryId', validateParams(categoryIdSchema), cacheProductMiddleware, asyncHandler(getProductsByCategory));
router.get('/products/:id', validateParams(productIdSchema), cacheProductMiddleware, asyncHandler(getProductById));
router.get('/stores/:storeId/products', validateParams(storeIdSchema), cacheProductMiddleware, asyncHandler(getProductsByStore));
router.get('/categories', cacheCategoryMiddleware, asyncHandler(getAllCategories));
router.get('/categories/:id', validateParams(categoryIdParamSchema), cacheCategoryMiddleware, asyncHandler(getCategoryById));

// Rotas para donos de loja - gerenciar produtos
router.post('/stores/:storeId/products', authenticate, authorize(['STORE_OWNER']), validateParams(storeIdSchema), validateBody(createProductSchema), asyncAuthenticatedHandler(createProduct));
router.put('/stores/:storeId/products/:id', authenticate, authorize(['STORE_OWNER']), validateParams(storeProductIdSchema), validateBody(updateProductSchema), asyncAuthenticatedHandler(updateProduct));
router.delete('/stores/:storeId/products/:id', authenticate, authorize(['STORE_OWNER']), validateParams(storeProductIdSchema), asyncAuthenticatedHandler(deleteProduct));
router.patch('/stores/:storeId/products/:id/toggle', authenticate, authorize(['STORE_OWNER']), validateParams(storeProductIdSchema), asyncAuthenticatedHandler(toggleProductAvailability));

// Rotas para administração - gerenciar categorias (apenas STORE_OWNER por enquanto)
router.post('/categories', authenticate, authorize(['STORE_OWNER']), validateBody(createCategorySchema), asyncAuthenticatedHandler(createCategory));
router.put('/categories/:id', authenticate, authorize(['STORE_OWNER']), validateParams(categoryIdParamSchema), validateBody(updateCategorySchema), asyncAuthenticatedHandler(updateCategory));
router.delete('/categories/:id', authenticate, authorize(['STORE_OWNER']), validateParams(categoryIdParamSchema), asyncAuthenticatedHandler(deleteCategory));

export default router;
