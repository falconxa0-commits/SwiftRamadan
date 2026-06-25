'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UploadResult {
  success: boolean;
  url?: string;
  message?: string;
}

interface MultipleUploadResult {
  success: boolean;
  urls?: string[];
  message?: string;
}

/**
 * useUpload — small client hook for the /api/upload endpoint.
 * Supports single-file uploads via FormData and (optionally)
 * multiple-file uploads via /api/upload/multiple.
 *
 * The hook returns:
 *   - upload(file):  upload a single file → returns URL or null
 *   - uploadMany(files): upload up to 5 files → returns URL[] or null
 *   - uploading: boolean busy flag
 */
export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data: UploadResult = await res.json();
        if (data.success && data.url) {
          return data.url;
        }
        toast({
          title: 'Upload failed',
          description: data.message || 'Could not upload file.',
          variant: 'destructive',
        });
        return null;
      } catch {
        toast({
          title: 'Upload failed',
          description: 'Network error — please try again.',
          variant: 'destructive',
        });
        return null;
      } finally {
        setUploading(false);
      }
    },
    [toast]
  );

  const uploadMany = useCallback(
    async (files: File[]): Promise<string[] | null> => {
      if (!files.length) return [];
      setUploading(true);
      try {
        const formData = new FormData();
        for (const f of files) {
          formData.append('files', f);
        }
        const res = await fetch('/api/upload/multiple', {
          method: 'POST',
          body: formData,
        });
        const data: MultipleUploadResult = await res.json();
        if (data.success && data.urls) {
          return data.urls;
        }
        toast({
          title: 'Upload failed',
          description: data.message || 'Could not upload files.',
          variant: 'destructive',
        });
        return null;
      } catch {
        toast({
          title: 'Upload failed',
          description: 'Network error — please try again.',
          variant: 'destructive',
        });
        return null;
      } finally {
        setUploading(false);
      }
    },
    [toast]
  );

  /**
   * Upload a base64-encoded image (e.g. from a canvas / FileReader).
   * Returns the resulting URL or null.
   */
  const uploadBase64 = useCallback(
    async (dataUrl: string): Promise<string | null> => {
      setUploading(true);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });
        const data: UploadResult = await res.json();
        if (data.success && data.url) {
          return data.url;
        }
        toast({
          title: 'Upload failed',
          description: data.message || 'Could not upload image.',
          variant: 'destructive',
        });
        return null;
      } catch {
        toast({
          title: 'Upload failed',
          description: 'Network error — please try again.',
          variant: 'destructive',
        });
        return null;
      } finally {
        setUploading(false);
      }
    },
    [toast]
  );

  return { upload, uploadMany, uploadBase64, uploading };
}
