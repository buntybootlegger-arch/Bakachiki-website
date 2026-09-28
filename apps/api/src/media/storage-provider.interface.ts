export interface UploadResult {
  provider: string;
  publicId?: string;
  url: string;
  width?: number;
  height?: number;
}

export interface StorageProvider {
  upload(file: Express.Multer.File): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}
