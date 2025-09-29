import { Response } from 'express';
import { ProductService } from '../services/productService';
import { CategoryService } from '../services/categoryService';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendNotFound } from '../middleware/errorHandler';
import { invalidateProductCache, invalidateCategoryCache } from '../middleware/cache';
import { 
  CreateProductInput, 
  UpdateProductInput, 
  CreateCategoryInput, 
  UpdateCategoryInput 
} from '../schemas/productSchemas';

const productService = new ProductService();
const categoryService = new CategoryService();


// Product Controllers
export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { storeId } = req.params as { storeId: string };
  const validatedData = req.body as CreateProductInput;
  const product = await productService.createProduct(storeId, req.user.id, validatedData);
  
  await invalidateProductCache();
  sendSuccess(res, 'Produto criado com sucesso', { product }, 201);
};

export const getProductById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const product = await productService.getProductById(id);
  
  if (!product) {
    sendNotFound(res, 'Produto não encontrado');
    return;
  }
  
  sendSuccess(res, 'Produto obtido com sucesso', { product });
};

export const getProductsByStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { storeId } = req.params as { storeId: string };
  const products = await productService.getProductsByStore(storeId);
  sendSuccess(res, 'Produtos obtidos com sucesso', { products });
};

export const getAllProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const products = await productService.getAllProducts();
  sendSuccess(res, 'Produtos obtidos com sucesso', { products });
};

export const getProductsByCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { categoryId } = req.params as { categoryId: string };
  const products = await productService.getProductsByCategory(categoryId);
  sendSuccess(res, 'Produtos obtidos com sucesso', { products });
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { storeId, id } = req.params as { storeId: string; id: string };
  const validatedData = req.body as any;
  const product = await productService.updateProduct(id, storeId, req.user.id, validatedData);
  
  await invalidateProductCache(id);
  sendSuccess(res, 'Produto atualizado com sucesso', { product });
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { storeId, id } = req.params as { storeId: string; id: string };
  await productService.deleteProduct(id, storeId, req.user.id);
  
  await invalidateProductCache(id);
  sendSuccess(res, 'Produto excluído com sucesso');
};

export const toggleProductAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { storeId, id } = req.params as { storeId: string; id: string };
  const product = await productService.toggleProductAvailability(id, storeId, req.user.id);
  
  const message = `Produto ${product.isAvailable ? 'disponibilizado' : 'indisponibilizado'} com sucesso`;
  sendSuccess(res, message, { product });
};

// Category Controllers
export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedData = req.body as CreateCategoryInput;
  const category = await categoryService.createCategory(validatedData);
  
  await invalidateCategoryCache();
  sendSuccess(res, 'Categoria criada com sucesso', { category }, 201);
};

export const getAllCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const categories = await categoryService.getAllCategories();
  sendSuccess(res, 'Categorias obtidas com sucesso', { categories });
};

export const getCategoryById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const category = await categoryService.getCategoryById(id);
  
  if (!category) {
    sendNotFound(res, 'Categoria não encontrada');
    return;
  }
  
  sendSuccess(res, 'Categoria obtida com sucesso', { category });
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const validatedData = req.body as UpdateCategoryInput;
  const category = await categoryService.updateCategory(id, validatedData);
  
  await invalidateCategoryCache();
  sendSuccess(res, 'Categoria atualizada com sucesso', { category });
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  await categoryService.deleteCategory(id);
  
  await invalidateCategoryCache();
  sendSuccess(res, 'Categoria excluída com sucesso');
};
