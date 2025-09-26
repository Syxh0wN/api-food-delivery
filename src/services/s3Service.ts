import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { prisma } from '../config/database';
import {
  UploadRequest,
  UploadResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
  ImageProcessingOptions,
  FileValidationOptions,
  DeleteRequest,
  ListFilesRequest,
  ListFilesResponse,
  UploadFolder,
  ImageSize,
  ImageVariants
} from '../types/upload';

class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || 'myfood-uploads';
    
    // Modo de simulação para testes
    if (process.env.NODE_ENV === 'test' || !process.env.AWS_ACCESS_KEY_ID) {
      this.s3Client = null as any;
      return;
    }
    
    const config: any = {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
    };

    if (process.env.AWS_S3_ENDPOINT) {
      config.endpoint = process.env.AWS_S3_ENDPOINT;
    }

    this.s3Client = new S3Client(config);
  }

  async uploadFile(request: UploadRequest): Promise<UploadResponse> {
    const { file, folder, userId, metadata = {} } = request;
    
    // Validar arquivo
    this.validateFile(file);
    
    // Gerar chave única
    const fileExtension = this.getFileExtension(file.originalname);
    const fileName = `${randomUUID()}${fileExtension}`;
    const key = `${folder}/${userId}/${fileName}`;
    
    let processedBuffer = file.buffer;
    let mimeType = file.mimetype;
    
    // Processar imagem se for uma imagem (apenas em produção)
    if (this.isImage(file.mimetype) && this.s3Client) {
      const processed = await this.processImage(file.buffer, {
        width: 1200,
        height: 1200,
        quality: 85,
        format: 'jpeg'
      });
      processedBuffer = processed.buffer;
      mimeType = processed.mimeType;
    }
    
    // Simular upload para S3 em modo de teste
    if (!this.s3Client) {
      console.log('Simulando upload para S3:', key);
    } else {
      // Upload para S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: processedBuffer,
        ContentType: mimeType,
        Metadata: {
          userId,
          originalName: file.originalname,
          folder,
          uploadedAt: new Date().toISOString(),
          ...metadata
        },
        ACL: 'public-read'
      });
      
      await this.s3Client.send(uploadCommand);
    }
    
    // Gerar URL pública
    const url = this.getPublicUrl(key);
    
    // Salvar no banco de dados
    const uploadRecord = await prisma.upload.create({
      data: {
        userId,
        key,
        url,
        bucket: this.bucket,
        size: processedBuffer.length,
        mimeType,
        originalName: file.originalname,
        folder,
        metadata: metadata
      }
    });
    
    return {
      id: uploadRecord.id,
      url,
      key,
      bucket: this.bucket,
      size: processedBuffer.length,
      mimeType,
      originalName: file.originalname,
      folder,
      userId,
      metadata,
      createdAt: uploadRecord.createdAt
    };
  }

  async generatePresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    const { fileName, mimeType, folder, userId, expiresIn = 3600, metadata = {} } = request;
    
    // Validar tipo de arquivo
    this.validateMimeType(mimeType);
    
    // Gerar chave única
    const fileExtension = this.getFileExtension(fileName);
    const uniqueFileName = `${randomUUID()}${fileExtension}`;
    const key = `${folder}/${userId}/${uniqueFileName}`;
    
    // Simular URL pré-assinada em modo de teste
    if (!this.s3Client) {
      console.log('Simulando URL pré-assinada para:', key);
      return {
        uploadUrl: `https://simulated-s3.amazonaws.com/${this.bucket}/${key}`,
        key,
        bucket: this.bucket,
        expiresIn,
        fields: {
          key,
          'Content-Type': mimeType,
          'x-amz-acl': 'public-read'
        }
      };
    }
    
    // Gerar URL pré-assinada
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      Metadata: {
        userId,
        originalName: fileName,
        folder,
        ...metadata
      },
      ACL: 'public-read'
    });
    
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
    
    return {
      uploadUrl,
      key,
      bucket: this.bucket,
      expiresIn,
      fields: {
        key,
        'Content-Type': mimeType,
        'x-amz-acl': 'public-read'
      }
    };
  }

  async deleteFile(request: DeleteRequest): Promise<boolean> {
    const { key, userId } = request;
    
    // Verificar se o arquivo pertence ao usuário
    const uploadRecord = await prisma.upload.findFirst({
      where: { key, userId }
    });
    
    if (!uploadRecord) {
      throw new Error('Arquivo não encontrado ou não pertence ao usuário');
    }
    
    // Simular deleção do S3 em modo de teste
    if (!this.s3Client) {
      console.log('Simulando deleção do S3:', key);
    } else {
      // Deletar do S3
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      
      await this.s3Client.send(deleteCommand);
    }
    
    // Deletar do banco de dados
    await prisma.upload.delete({
      where: { id: uploadRecord.id }
    });
    
    return true;
  }

  async listFiles(request: ListFilesRequest): Promise<ListFilesResponse> {
    const { userId, folder, prefix = '', maxKeys = 50, continuationToken } = request;
    
    // Em modo de teste, buscar apenas do banco de dados
    if (!this.s3Client) {
      const uploadRecords = await prisma.upload.findMany({
        where: {
          userId,
          ...(folder && { folder })
        },
        take: maxKeys,
        orderBy: { createdAt: 'desc' }
      });
      
      const files = uploadRecords.map(record => ({
        id: record.id,
        url: record.url,
        key: record.key,
        bucket: record.bucket,
        size: record.size,
        mimeType: record.mimeType,
        originalName: record.originalName,
        folder: record.folder,
        userId: record.userId,
        metadata: record.metadata as Record<string, string>,
        createdAt: record.createdAt
      }));
      
      return {
        files,
        continuationToken: undefined,
        hasMore: false,
        totalCount: files.length
      };
    }
    
    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: folder ? `${folder}/${userId}/` : `${prefix}`,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken
    });
    
    const response = await this.s3Client.send(listCommand);
    
    const files = await Promise.all(
      (response.Contents || []).map(async (object) => {
        if (!object.Key) return null;
        
        const uploadRecord = await prisma.upload.findFirst({
          where: { key: object.Key }
        });
        
        if (!uploadRecord) return null;
        
        return {
          id: uploadRecord.id,
          url: uploadRecord.url,
          key: uploadRecord.key,
          bucket: uploadRecord.bucket,
          size: uploadRecord.size,
          mimeType: uploadRecord.mimeType,
          originalName: uploadRecord.originalName,
          folder: uploadRecord.folder,
          userId: uploadRecord.userId,
          metadata: uploadRecord.metadata,
          createdAt: uploadRecord.createdAt
        };
      })
    );
    
    return {
      files: files.filter(Boolean) as UploadResponse[],
      continuationToken: response.NextContinuationToken || undefined,
      hasMore: response.IsTruncated || false,
      totalCount: files.filter(Boolean).length
    };
  }

  async generateImageVariants(key: string, userId: string): Promise<ImageVariants> {
    const variants: ImageVariants = { original: this.getPublicUrl(key) };
    
    // Simular geração de variantes em modo de teste
    if (!this.s3Client) {
      console.log('Simulando geração de variantes para:', key);
      return {
        original: this.getPublicUrl(key),
        large: this.getPublicUrl(key.replace(/(\.[^.]+)$/, '_large$1')),
        medium: this.getPublicUrl(key.replace(/(\.[^.]+)$/, '_medium$1')),
        small: this.getPublicUrl(key.replace(/(\.[^.]+)$/, '_small$1')),
        thumbnail: this.getPublicUrl(key.replace(/(\.[^.]+)$/, '_thumbnail$1'))
      };
    }
    
    try {
      // Buscar arquivo original
      const getCommand = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      
      const response = await this.s3Client.send(getCommand);
      const buffer = await this.streamToBuffer(response.Body as any);
      
      // Gerar variantes
      const sizes = [
        { name: 'large', width: 800, height: 600 },
        { name: 'medium', width: 400, height: 300 },
        { name: 'small', width: 200, height: 150 },
        { name: 'thumbnail', width: 100, height: 100 }
      ];
      
      for (const size of sizes) {
        const processed = await this.processImage(buffer, {
          width: size.width,
          height: size.height,
          quality: 80,
          format: 'jpeg',
          resize: 'cover'
        });
        
        const variantKey = key.replace(/(\.[^.]+)$/, `_${size.name}$1`);
        
        const uploadCommand = new PutObjectCommand({
          Bucket: this.bucket,
          Key: variantKey,
          Body: processed.buffer,
          ContentType: processed.mimeType,
          ACL: 'public-read'
        });
        
        await this.s3Client.send(uploadCommand);
        
        variants[size.name as keyof ImageVariants] = this.getPublicUrl(variantKey);
      }
      
      return variants;
    } catch (error) {
      console.error('Erro ao gerar variantes de imagem:', error);
      return variants;
    }
  }

  private async processImage(buffer: Buffer, options: ImageProcessingOptions): Promise<{ buffer: Buffer; mimeType: string }> {
    let sharpInstance = sharp(buffer);
    
    // Redimensionar
    if (options.width || options.height) {
      sharpInstance = sharpInstance.resize(options.width, options.height, {
        fit: options.resize || 'cover',
        position: 'center'
      });
    }
    
    // Converter formato
    switch (options.format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality: options.quality || 85 });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality: options.quality || 85 });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: options.quality || 85 });
        break;
    }
    
    const processedBuffer = await sharpInstance.toBuffer();
    const mimeType = `image/${options.format || 'jpeg'}`;
    
    return { buffer: processedBuffer, mimeType };
  }

  private validateFile(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain'
    ];
    
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
    }
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Tipo de arquivo não permitido');
    }
  }

  private validateMimeType(mimeType: string): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain'
    ];
    
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error('Tipo de arquivo não permitido');
    }
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot) : '';
  }

  private getPublicUrl(key: string): string {
    if (process.env.AWS_S3_ENDPOINT) {
      return `${process.env.AWS_S3_ENDPOINT}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}

export const s3Service = new S3Service();
