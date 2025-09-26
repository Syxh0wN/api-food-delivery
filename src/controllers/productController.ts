import { Response } from 'express';
import { ProductService } from '../services/productService';
import { CategoryService } from '../services/categoryService';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { UpdateProductInput } from '../types/product';
import { invalidateProductCache, invalidateCategoryCache } from '../middleware/cache';

const productService = new ProductService();
const categoryService = new CategoryService();

const createProductSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  isAvailable: z.boolean().optional(),
  preparationTime: z.number().min(1, 'Tempo de preparo deve ser no mínimo 1 minuto').optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  images: z.array(z.string().url('Imagem deve ser uma URL válida')).optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  nutritionalInfo: z.object({
    calories: z.number().min(0).optional(),
    protein: z.number().min(0).optional(),
    carbs: z.number().min(0).optional(),
    fat: z.number().min(0).optional(),
    fiber: z.number().min(0).optional()
  }).optional()
});

const updateProductSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero').optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória').optional(),
  isAvailable: z.boolean().optional(),
  preparationTime: z.number().min(1, 'Tempo de preparo deve ser no mínimo 1 minuto').optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  images: z.array(z.string().url('Imagem deve ser uma URL válida')).optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  nutritionalInfo: z.object({
    calories: z.number().min(0).optional(),
    protein: z.number().min(0).optional(),
    carbs: z.number().min(0).optional(),
    fat: z.number().min(0).optional(),
    fiber: z.number().min(0).optional()
  }).optional()
});

const createCategorySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional()
});

const updateCategorySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  description: z.string().optional()
});

// Product Controllers
export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { storeId } = req.params;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'ID da loja é obrigatório' });
      return;
    }
    const validatedData = createProductSchema.parse(req.body);
    const product = await productService.createProduct(storeId, req.user.userId, validatedData);
    
    await invalidateProductCache();
    
    res.status(201).json({
      success: true,
      message: 'Produto criado com sucesso',
      data: { product }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getProductById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID do produto é obrigatório' });
      return;
    }
    const product = await productService.getProductById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Produto obtido com sucesso',
      data: { product }
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getProductsByStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { storeId } = req.params;
      const products = await productService.getProductsByStore(storeId!);
    
    res.status(200).json({
      success: true,
      message: 'Produtos obtidos com sucesso',
      data: { products }
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getAllProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const products = await productService.getAllProducts();
    
    res.status(200).json({
      success: true,
      message: 'Produtos obtidos com sucesso',
      data: { products }
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getProductsByCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const products = await productService.getProductsByCategory(categoryId!);
    
    res.status(200).json({
      success: true,
      message: 'Produtos obtidos com sucesso',
      data: { products }
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { storeId, id } = req.params;
    const validatedData = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(id!, storeId!, req.user!.userId, validatedData as UpdateProductInput);
    
    await invalidateProductCache(id);
    
    res.status(200).json({
      success: true,
      message: 'Produto atualizado com sucesso',
      data: { product }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { storeId, id } = req.params;
    await productService.deleteProduct(id!, storeId!, req.user!.userId);
    
    await invalidateProductCache(id);
    
    res.status(200).json({
      success: true,
      message: 'Produto excluído com sucesso'
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const toggleProductAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { storeId, id } = req.params;
    const product = await productService.toggleProductAvailability(id!, storeId!, req.user!.userId);
    
    res.status(200).json({
      success: true,
      message: `Produto ${product.isAvailable ? 'disponibilizado' : 'indisponibilizado'} com sucesso`,
      data: { product }
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Category Controllers
export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = createCategorySchema.parse(req.body);
    const category = await categoryService.createCategory(validatedData);
    
    await invalidateCategoryCache();
    
    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso',
      data: { category }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getAllCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categories = await categoryService.getAllCategories();
    
    res.status(200).json({
      success: true,
      message: 'Categorias obtidas com sucesso',
      data: { categories }
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getCategoryById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id!);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Categoria obtida com sucesso',
      data: { category }
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);
    const category = await categoryService.updateCategory(id!, validatedData);
    
    await invalidateCategoryCache();
    
    res.status(200).json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      data: { category }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id!);
    
    await invalidateCategoryCache();
    
    res.status(200).json({
      success: true,
      message: 'Categoria excluída com sucesso'
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};
