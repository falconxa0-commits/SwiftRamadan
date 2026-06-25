import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/* ---------------------------------------------------------------------------
 * /api/upload/multiple — multi-file image upload (up to 5 files).
 *
 * Accepts multipart/form-data under `files` (or `file`) field.
 * Same per-file validation as /api/upload (image-only, max 5 MB).
 * Partial success: returns `urls[]` for saved files plus `errors[]` for rejects.
 * ------------------------------------------------------------------------- */

export const runtime = 'nodejs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const PUBLIC_PREFIX = '/uploads/';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

interface SavedFile {
  url: string;
  filename: string;
  size: number;
  type: string;
  originalName: string;
}

interface FileError {
  originalName: string;
  message: string;
}

function errorResponse(
  status: number,
  message: string,
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json(
    { success: false, message, ...extra },
    { status },
  );
}

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

async function saveBuffer(
  buf: Buffer,
  mime: string,
  originalName: string,
): Promise<SavedFile> {
  await ensureUploadDir();
  const ext = ALLOWED[mime.toLowerCase()];
  if (!ext) throw new Error(`Unsupported MIME type: ${mime}`);

  const timestamp = Date.now();
  const random = crypto.randomBytes(6).toString('hex');
  const filename = `${timestamp}-${random}.${ext}`;
  const fullPath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(fullPath, buf);

  return {
    url: `${PUBLIC_PREFIX}${filename}`,
    filename,
    size: buf.byteLength,
    type: mime,
    originalName,
  };
}

/** Validate one file. Returns null on success, or an error message string. */
function validateFile(mime: string, buf: Buffer): string | null {
  if (!mime || !ALLOWED[mime.toLowerCase()]) {
    return `Unsupported file type: ${mime || 'unknown'}. Allowed: jpeg, png, webp, gif.`;
  }
  if (!buf || buf.byteLength === 0) return 'File is empty.';
  if (buf.byteLength > MAX_BYTES) {
    return `File too large (${buf.byteLength} bytes). Max ${MAX_BYTES} bytes (5 MB).`;
  }
  return null;
}

// POST /api/upload/multiple
export async function POST(req: NextRequest) {
  const rateLimited = checkRateLimit(req, RATE_LIMITS.upload);
  if (rateLimited) return rateLimited;

  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('multipart/form-data')) {
    return errorResponse(
      400,
      'Unsupported Content-Type. Use multipart/form-data with `files` (or `file`) field.',
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return errorResponse(400, 'Invalid multipart body.');
  }

  // Collect every File entry under `files` or `file` (FormData.getAll handles
  // multiple entries with the same field name; we also fall back to `file`).
  const entries: File[] = [];
  const all = form.getAll('files');
  if (all.length > 0) {
    for (const entry of all) {
      if (entry instanceof File) entries.push(entry);
    }
  }
  if (entries.length === 0) {
    const single = form.get('file');
    if (single instanceof File) entries.push(single);
  }

  if (entries.length === 0) {
    return errorResponse(
      400,
      'No files provided. Use field name `files` (or `file`).',
    );
  }

  if (entries.length > MAX_FILES) {
    return errorResponse(
      400,
      `Too many files (${entries.length}). Max ${MAX_FILES} per request.`,
    );
  }

  const urls: string[] = [];
  const savedMeta: SavedFile[] = [];
  const errors: FileError[] = [];

  for (const file of entries) {
    const originalName = file.name || 'upload';
    try {
      if (file.size === 0) {
        errors.push({ originalName, message: 'File is empty.' });
        continue;
      }
      const mime = (file.type || '').toLowerCase();
      const buf = Buffer.from(await file.arrayBuffer());
      const validationError = validateFile(mime, buf);
      if (validationError) {
        errors.push({ originalName, message: validationError });
        continue;
      }
      const saved = await saveBuffer(buf, mime, originalName);
      urls.push(saved.url);
      savedMeta.push(saved);
    } catch (err) {
      console.error('[upload/multiple] error saving', originalName, err);
      errors.push({ originalName, message: 'Failed to write file to disk.' });
    }
  }

  // Partial success: at least one file saved AND some failed.
  // Total failure: nothing saved → 500 to signal client something went wrong.
  if (urls.length === 0) {
    return errorResponse(500, 'No files could be saved.', { errors });
  }

  return NextResponse.json({
    success: true,
    urls,
    count: urls.length,
    files: savedMeta,
    ...(errors.length > 0 ? { errors } : {}),
  });
}
