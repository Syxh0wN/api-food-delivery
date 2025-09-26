export interface UploadRequest {
  file: Express.Multer.File;
  folder: string;
  userId: string;
  metadata?: Record<string, string>;
}

export interface UploadResponse {
  id: string;
  url: string;
  key: string;
  bucket: string;
  size: number;
  mimeType: string;
  originalName: string;
  folder: string;
  userId: string;
  metadata?: Record<string, string>;
  createdAt: Date;
}

export interface PresignedUrlRequest {
  fileName: string;
  mimeType: string;
  folder: string;
  userId: string;
  expiresIn?: number;
  metadata?: Record<string, string>;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  bucket: string;
  expiresIn: number;
  fields: Record<string, string>;
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  resize?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface FileValidationOptions {
  maxSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export interface UploadMetadata {
  userId: string;
  folder: string;
  originalName: string;
  mimeType: string;
  size: number;
  processed?: boolean;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface DeleteRequest {
  key: string;
  userId: string;
}

export interface ListFilesRequest {
  userId: string;
  folder?: string | undefined;
  prefix?: string | undefined;
  maxKeys?: number;
  continuationToken?: string | undefined;
}

export interface ListFilesResponse {
  files: UploadResponse[];
  continuationToken?: string | undefined;
  hasMore: boolean;
  totalCount: number;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  storageClass: string;
  metadata: Record<string, string>;
}

export enum UploadFolder {
  AVATARS = 'avatars',
  PRODUCTS = 'products',
  STORES = 'stores',
  CATEGORIES = 'categories',
  BANNERS = 'banners',
  TEMP = 'temp'
}

export enum ImageSize {
  THUMBNAIL = 'thumbnail',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ORIGINAL = 'original'
}

export interface ImageVariants {
  original: string;
  large?: string;
  medium?: string;
  small?: string;
  thumbnail?: string;
}
