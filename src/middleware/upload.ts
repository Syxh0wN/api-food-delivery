import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Configuração do multer para upload em memória
const storage = multer.memoryStorage();

// Filtro de arquivos
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Tipos de arquivo permitidos
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Apenas imagens, PDFs e arquivos de texto são aceitos.'));
  }
};

// Configuração do multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Máximo 5 arquivos por vez
  }
});

// Middleware para upload de arquivo único
export const uploadSingle = (fieldName: string = 'file') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (error: any) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            success: false,
            message: 'Arquivo muito grande. Tamanho máximo: 10MB'
          });
          return;
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          res.status(400).json({
            success: false,
            message: 'Muitos arquivos. Máximo: 5 arquivos'
          });
          return;
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          res.status(400).json({
            success: false,
            message: `Campo de arquivo inesperado. Use: ${fieldName}`
          });
          return;
        }
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      if (error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      next();
    });
  };
};

// Middleware para upload de múltiplos arquivos
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (error: any) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            success: false,
            message: 'Arquivo muito grande. Tamanho máximo: 10MB'
          });
          return;
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          res.status(400).json({
            success: false,
            message: `Muitos arquivos. Máximo: ${maxCount} arquivos`
          });
          return;
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          res.status(400).json({
            success: false,
            message: `Campo de arquivo inesperado. Use: ${fieldName}`
          });
          return;
        }
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      if (error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      next();
    });
  };
};

// Middleware para upload de campos específicos
export const uploadFields = (fields: multer.Field[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uploadMiddleware = upload.fields(fields);
    
    uploadMiddleware(req, res, (error: any) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            success: false,
            message: 'Arquivo muito grande. Tamanho máximo: 10MB'
          });
          return;
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          res.status(400).json({
            success: false,
            message: 'Muitos arquivos enviados'
          });
          return;
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          res.status(400).json({
            success: false,
            message: 'Campo de arquivo inesperado'
          });
          return;
        }
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      if (error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      next();
    });
  };
};

// Middleware para validação de imagem
export const validateImage = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  // Verificar se é uma imagem
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({
      success: false,
      message: 'Apenas imagens são permitidas'
    });
  }

  // Verificar dimensões da imagem (opcional)
  // Aqui você pode adicionar validações específicas de dimensão se necessário

  next();
};

// Middleware para validação de avatar
export const validateAvatar = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  // Verificar se é uma imagem
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({
      success: false,
      message: 'Avatar deve ser uma imagem'
    });
  }

  // Verificar se é um formato suportado para avatar
  const allowedAvatarTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedAvatarTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Avatar deve ser JPEG, PNG ou WebP'
    });
  }

  next();
};

// Middleware para validação de produto
export const validateProductImage = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  // Verificar se é uma imagem
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({
      success: false,
      message: 'Imagem do produto deve ser uma imagem'
    });
  }

  // Verificar se é um formato suportado para produto
  const allowedProductTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedProductTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Imagem do produto deve ser JPEG, PNG ou WebP'
    });
  }

  next();
};

// Função para gerar nome único de arquivo
export const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = randomUUID().substring(0, 8);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
};

// Função para validar tamanho de arquivo
export const validateFileSize = (file: Express.Multer.File, maxSize: number = 10 * 1024 * 1024): boolean => {
  return file.size <= maxSize;
};

// Função para validar tipo MIME
export const validateMimeType = (file: Express.Multer.File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.mimetype);
};

// Função para obter extensão do arquivo
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Função para sanitizar nome do arquivo
export const sanitizeFileName = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};
