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

const router = Router();

// Rotas públicas
router.get('/products', getAllProducts);
router.get('/products/category/:categoryId', getProductsByCategory);
router.get('/products/:id', getProductById);
router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategoryById);

// Rotas protegidas - requer autenticação
router.use(authenticate);

// Rotas para produtos de lojas específicas (qualquer usuário autenticado pode ver)
router.get('/stores/:storeId/products', getProductsByStore);

// Rotas para donos de loja - gerenciar produtos
router.post('/stores/:storeId/products', authorize(['STORE_OWNER']), createProduct);
router.put('/stores/:storeId/products/:id', authorize(['STORE_OWNER']), updateProduct);
router.delete('/stores/:storeId/products/:id', authorize(['STORE_OWNER']), deleteProduct);
router.patch('/stores/:storeId/products/:id/toggle', authorize(['STORE_OWNER']), toggleProductAvailability);

// Rotas para administração - gerenciar categorias (apenas STORE_OWNER por enquanto)
router.post('/categories', authorize(['STORE_OWNER']), createCategory);
router.put('/categories/:id', authorize(['STORE_OWNER']), updateCategory);
router.delete('/categories/:id', authorize(['STORE_OWNER']), deleteCategory);

export default router;
