import { Response } from 'express';
import { s3Service } from '../services/s3Service';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { UserRole, UploadFolder } from '@prisma/client';

const uploadFileSchema = z.object({
  folder: z.nativeEnum(UploadFolder),
  metadata: z.record(z.string(), z.string()).optional()
});

const presignedUrlSchema = z.object({
  fileName: z.string().min(1, 'Nome do arquivo é obrigatório'),
  mimeType: z.string().min(1, 'Tipo MIME é obrigatório'),
  folder: z.nativeEnum(UploadFolder),
  expiresIn: z.number().min(60).max(3600).optional().default(3600),
  metadata: z.record(z.string(), z.string()).optional()
});

const deleteFileSchema = z.object({
  key: z.string().min(1, 'Chave do arquivo é obrigatória')
});

const listFilesSchema = z.object({
  folder: z.nativeEnum(UploadFolder).optional(),
  prefix: z.string().optional(),
  maxKeys: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default(50),
  continuationToken: z.string().optional()
});

export const uploadFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
      return;
    }

    const validatedData = uploadFileSchema.parse(req.body);
    
    const uploadRequest = {
      file: req.file,
      folder: validatedData.folder,
      userId: req.user.id,
      metadata: validatedData.metadata || {}
    };

    const result = await s3Service.uploadFile(uploadRequest);
    
    res.status(201).json({ 
      success: true, 
      message: 'Arquivo enviado com sucesso', 
      data: { upload: result } 
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
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const generatePresignedUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const validatedData = presignedUrlSchema.parse(req.body);
    
    const presignedRequest = {
      fileName: validatedData.fileName,
      mimeType: validatedData.mimeType,
      folder: validatedData.folder,
      userId: req.user.id,
      expiresIn: validatedData.expiresIn,
      metadata: validatedData.metadata || {}
    };

    const result = await s3Service.generatePresignedUrl(presignedRequest);
    
    res.status(200).json({ 
      success: true, 
      message: 'URL pré-assinada gerada com sucesso', 
      data: { presignedUrl: result } 
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
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const validatedData = deleteFileSchema.parse(req.body);
    
    const deleteRequest = {
      key: validatedData.key,
      userId: req.user.id
    };

    await s3Service.deleteFile(deleteRequest);
    
    res.status(200).json({ 
      success: true, 
      message: 'Arquivo deletado com sucesso' 
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
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listFiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const validatedData = listFilesSchema.parse(req.query);
    
    const listRequest = {
      userId: req.user.id,
      folder: validatedData.folder || undefined,
      prefix: validatedData.prefix || undefined,
      maxKeys: validatedData.maxKeys,
      continuationToken: validatedData.continuationToken || undefined
    };

    const result = await s3Service.listFiles(listRequest);
    
    res.status(200).json({ 
      success: true, 
      data: { files: result } 
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
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const generateImageVariants = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { key } = req.params;
    
    if (!key) {
      res.status(400).json({
        success: false,
        message: 'Chave do arquivo é obrigatória'
      });
      return;
    }

    const variants = await s3Service.generateImageVariants(key, req.user.id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Variantes de imagem geradas com sucesso', 
      data: { variants } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const uploadAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
      return;
    }

    // Validar se é uma imagem
    if (!req.file.mimetype.startsWith('image/')) {
      res.status(400).json({
        success: false,
        message: 'Apenas imagens são permitidas para avatar'
      });
      return;
    }

    const uploadRequest = {
      file: req.file,
      folder: UploadFolder.AVATARS,
      userId: req.user.id,
      metadata: { type: 'avatar' }
    };

    const result = await s3Service.uploadFile(uploadRequest);
    
    // Atualizar avatar do usuário
    const { prisma } = await import('../config/database');
    await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: result.url }
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Avatar atualizado com sucesso', 
      data: { upload: result } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const uploadProductImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
      return;
    }

    const { productId } = req.params;
    
    if (!productId) {
      res.status(400).json({
        success: false,
        message: 'ID do produto é obrigatório'
      });
      return;
    }

    // Verificar se o produto pertence ao usuário
    const { prisma } = await import('../config/database');
    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        store: { ownerId: req.user.id }
      }
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Produto não encontrado ou não pertence ao usuário'
      });
      return;
    }

    const uploadRequest = {
      file: req.file,
      folder: UploadFolder.PRODUCTS,
      userId: req.user.id,
      metadata: { 
        type: 'product',
        productId,
        storeId: product.storeId
      }
    };

    const result = await s3Service.uploadFile(uploadRequest);
    
    // Atualizar imagem do produto
    await prisma.product.update({
      where: { id: productId },
      data: { 
        images: {
          push: result.url
        }
      }
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Imagem do produto enviada com sucesso', 
      data: { upload: result } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
