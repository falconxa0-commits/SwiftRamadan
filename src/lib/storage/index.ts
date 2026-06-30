import { uploadImage, buildImageUrl, isCloudinaryConfigured, getUploadPreset, getCloudName, deleteImage } from './cloudinary';
import { uploadVideo, getVideoStatus, deleteVideo, isStreamConfigured } from './stream';

export type StorageProvider = 'cloudinary' | 'stream';

export interface FileUploadResult {
  success: boolean;
  url: string;
  publicId: string;
  provider: StorageProvider;
  metadata?: Record<string, unknown>;
}

// Unified file upload — routes to appropriate provider based on file type
export async function uploadFile(options: {
  file: Buffer | string;
  name?: string;
  folder?: string;
  type: 'image' | 'video';
  meta?: Record<string, string>;
}): Promise<FileUploadResult> {
  if (options.type === 'image') {
    const result = await uploadImage({
      file: options.file,
      folder: options.folder,
    });
    return {
      success: result.success,
      url: result.url,
      publicId: result.publicId,
      provider: 'cloudinary',
      metadata: { width: result.width, height: result.height, format: result.format },
    };
  }

  if (options.type === 'video') {
    const result = await uploadVideo({
      file: options.file as Buffer,
      name: options.name || 'video',
      meta: options.meta,
    });
    return {
      success: result.success,
      url: result.playbackUrl,
      publicId: result.uid,
      provider: 'stream',
      metadata: { thumbnailUrl: result.thumbnailUrl, status: result.status },
    };
  }

  return { success: false, url: '', publicId: '', provider: 'cloudinary' };
}

export { uploadImage, buildImageUrl, isCloudinaryConfigured, getUploadPreset, getCloudName, deleteImage, uploadVideo, getVideoStatus, deleteVideo, isStreamConfigured };
