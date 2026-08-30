/**
 * KYC Document Storage Utility
 * 
 * Handles storage of KYC documents as files instead of base64 in database.
 * This reduces database bloat and improves performance.
 * 
 * Features:
 * - Saves documents to public/uploads/kyc/ directory
 * - Stores only file path in database
 * - Validates file size (max 5MB)
 * - Processes images (resize, compress, convert to JPEG)
 * - Backward compatible with existing base64 documents
 */

import { promises as fs } from 'fs';
import path from 'path';

// ── Configuration ──
const KYC_UPLOAD_DIR = './public/uploads/kyc';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_DIMENSION = 1920; // Max width or height
const JPEG_QUALITY = 85; // 1-100

// ── Types ──
export interface KYCFileResult {
  success: boolean;
  filePath?: string;
  url?: string;
  error?: string;
  originalSize?: number;
  processedSize?: number;
}

export interface KYCStorageConfig {
  maxFileSize?: number;
  maxDimension?: number;
  quality?: number;
  uploadDir?: string;
}

// ── Default config ──
const defaultConfig: Required<KYCStorageConfig> = {
  maxFileSize: MAX_FILE_SIZE_BYTES,
  maxDimension: MAX_IMAGE_DIMENSION,
  quality: JPEG_QUALITY,
  uploadDir: KYC_UPLOAD_DIR,
};

/**
 * Ensure the upload directory exists
 */
async function ensureUploadDir(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Extract MIME type and raw data from base64 string
 * Supports formats:
 * - data:image/png;base64,iVBORw0KGgo...
 * - data:image/jpeg;base64,/9j/4AAQ...
 * - plain base64 string (assumes image/jpeg)
 */
function parseBase64Image(base64Data: string): { mimeType: string; data: Buffer } | null {
  // Handle data URI format
  const dataUriMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUriMatch) {
    return {
      mimeType: dataUriMatch[1],
      data: Buffer.from(dataUriMatch[2], 'base64'),
    };
  }

  // Plain base64 - assume JPEG
  try {
    return {
      mimeType: 'image/jpeg',
      data: Buffer.from(base64Data, 'base64'),
    };
  } catch {
    return null;
  }
}

/**
 * Get file extension from MIME type
 */
function getExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  };
  return extensions[mimeType.toLowerCase()] || '.jpg';
}

/**
 * Validate file size
 */
function validateFileSize(buffer: Buffer, maxSize: number): string | null {
  if (buffer.length > maxSize) {
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
    const maxMB = (maxSize / (1024 * 1024)).toFixed(2);
    return `File size (${sizeMB}MB) exceeds maximum allowed (${maxMB}MB)`;
  }
  return null;
}

/**
 * Process image: resize if needed, convert to buffer
 * For now, returns the original buffer. 
 * In production, you'd use sharp/jimp for actual processing.
 * This is a placeholder that can be enhanced.
 */
async function processImage(
  buffer: Buffer,
  mimeType: string,
  config: Required<KYCStorageConfig>
): Promise<Buffer> {
  // If sharp is available, use it for processing
  try {
    const sharp = (await import('sharp')).default;
    
    let pipeline = sharp(buffer);
    
    // Get metadata to check dimensions
    const metadata = await pipeline.metadata();
    
    // Resize if either dimension exceeds max
    if (metadata.width && metadata.width > config.maxDimension) {
      pipeline = pipeline.resize({
        width: config.maxDimension,
        height: config.maxDimension,
        fit: 'inside', // Maintain aspect ratio
        withoutEnlargement: true,
      });
    } else if (metadata.height && metadata.height > config.maxDimension) {
      pipeline = pipeline.resize({
        width: config.maxDimension,
        height: config.maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Convert to JPEG with specified quality for smaller size
    return await pipeline
      .jpeg({ quality: config.quality })
      .toBuffer();
  } catch {
    // Sharp not available or error - return original buffer
    // This ensures backward compatibility
    console.warn('[kyc-storage] Image processing skipped (sharp not available)');
    return buffer;
  }
}

/**
 * Generate a unique filename for the KYC document
 */
function generateFilename(
  userId: string,
  documentType: string,
  extension: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitizedType = documentType.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${userId}_${sanitizedType}_${timestamp}_${random}${extension}`;
}

/**
 * Save a KYC document from base64 to file storage
 * 
 * @param base64Data - The base64 encoded image data
 * @param userId - The user's ID for organizing files
 * @param documentType - Type of document (national_id, voters_card, etc.)
 * @param options - Optional configuration overrides
 * @returns Result with file path or error
 */
export async function saveKYCDocument(
  base64Data: string,
  userId: string,
  documentType: string,
  options?: KYCStorageConfig
): Promise<KYCFileResult> {
  const config = { ...defaultConfig, ...options };

  try {
    // Parse the base64 data
    const parsed = parseBase64Image(base64Data);
    if (!parsed) {
      return {
        success: false,
        error: 'Invalid base64 image data',
      };
    }

    const { mimeType, data: originalBuffer } = parsed;
    const originalSize = originalBuffer.length;

    // Validate file size
    const sizeError = validateFileSize(originalBuffer, config.maxFileSize);
    if (sizeError) {
      return {
        success: false,
        error: sizeError,
        originalSize,
      };
    }

    // Ensure upload directory exists
    await ensureUploadDir(config.uploadDir);

    // Process image (resize, compress)
    const processedBuffer = await processImage(originalBuffer, mimeType, config);

    // Generate filename and save
    const extension = getExtension(mimeType);
    const filename = generateFilename(userId, documentType, extension);
    const filePath = path.join(config.uploadDir, filename);

    await fs.writeFile(filePath, processedBuffer);

    // Return relative path for database storage (without leading ./)
    const dbPath = filePath.replace(/^\.\//, '');
    const url = `/uploads/kyc/${filename}`;

    return {
      success: true,
      filePath: dbPath,
      url,
      originalSize,
      processedSize: processedBuffer.length,
    };
  } catch (error) {
    console.error('[kyc-storage] Error saving KYC document:', error);
    return {
      success: false,
      error: 'Failed to save document',
    };
  }
}

/**
 * Delete a KYC document file
 */
export async function deleteKYCDocument(filePath: string): Promise<boolean> {
  try {
    const fullPath = filePath.startsWith('./') ? filePath : `./${filePath}`;
    await fs.unlink(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a KYC document file and return as base64
 * Useful for backward compatibility when frontend expects base64
 */
export async function readKYCDocumentAsBase64(
  filePath: string
): Promise<string | null> {
  try {
    const fullPath = filePath.startsWith('./') ? filePath : `./${filePath}`;
    const buffer = await fs.readFile(fullPath);
    return buffer.toString('base64');
  } catch {
    return null;
  }
}

/**
 * Check if a path is a file path (new format) vs base64 (old format)
 */
export function isFilePath(value: string): boolean {
  // File paths don't contain base64 indicators and look like paths
  return (
    value.includes('/') &&
    !value.startsWith('data:') &&
    value.length < 500 // Base64 would be much longer
  );
}

/**
 * Migrate existing base64 KYC documents to file storage
 * Call this once during migration
 */
export async function migrateBase64ToFiles(
  userId: string,
  documentId: string,
  documentType: string,
  currentImageData: string
): Promise<{ migrated: boolean; newPath?: string }> {
  // Skip if already a file path
  if (isFilePath(currentImageData)) {
    return { migrated: false };
  }

  // Skip if empty
  if (!currentImageData || currentImageData.trim() === '') {
    return { migrated: false };
  }

  // Try to save as file
  const result = await saveKYCDocument(currentImageData, userId, documentType);
  
  if (result.success && result.filePath) {
    return { migrated: true, newPath: result.filePath };
  }

  return { migrated: false };
}
