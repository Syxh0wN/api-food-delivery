import { Router } from 'express';
import { 
  uploadFile, 
  generatePresignedUrl, 
  deleteFile, 
  listFiles,
  generateImageVariants,
  uploadAvatar,
  uploadProductImage
} from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/auth';
import { 
  uploadSingle, 
  uploadMultiple, 
  validateAvatar, 
  validateProductImage 
} from '../middleware/upload';
import { UserRole } from '@prisma/client';

const router = Router();

// Upload de arquivo único
router.post('/upload', 
  authenticate, 
  uploadSingle('file'), 
  uploadFile
);

// Upload de múltiplos arquivos
router.post('/upload-multiple', 
  authenticate, 
  uploadMultiple('files', 5), 
  uploadFile
);

// Gerar URL pré-assinada
router.post('/presigned-url', 
  authenticate, 
  generatePresignedUrl
);

// Deletar arquivo
router.delete('/delete', 
  authenticate, 
  deleteFile
);

// Listar arquivos do usuário
router.get('/list', 
  authenticate, 
  listFiles
);

// Gerar variantes de imagem
router.post('/variants/:key', 
  authenticate, 
  generateImageVariants
);

// Upload de avatar
router.post('/avatar', 
  authenticate, 
  uploadSingle('avatar'), 
  validateAvatar,
  uploadAvatar
);

// Upload de imagem de produto
router.post('/product/:productId', 
  authenticate, 
  authorize([UserRole.STORE_OWNER, UserRole.ADMIN]), 
  uploadSingle('image'), 
  validateProductImage,
  uploadProductImage
);

// Upload de imagem de loja
router.post('/store/:storeId', 
  authenticate, 
  authorize([UserRole.STORE_OWNER, UserRole.ADMIN]), 
  uploadSingle('image'), 
  validateProductImage,
  async (req, res) => {
    // Implementar upload de imagem de loja
    res.status(501).json({
      success: false,
      message: 'Upload de imagem de loja ainda não implementado'
    });
  }
);

// Upload de banner
router.post('/banner', 
  authenticate, 
  authorize([UserRole.ADMIN]), 
  uploadSingle('banner'), 
  validateProductImage,
  async (req, res) => {
    // Implementar upload de banner
    res.status(501).json({
      success: false,
      message: 'Upload de banner ainda não implementado'
    });
  }
);

export default router;
