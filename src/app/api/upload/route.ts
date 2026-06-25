import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/* ---------------------------------------------------------------------------
 * /api/upload — single-file image upload.
 *
 * Accepts BOTH:
 *   1. multipart/form-data  with a `file` field
 *   2. application/json     with `{ image: "data:image/...;base64,..." }`
 *
 * Validates image-only (jpeg/png/webp/gif), max 5 MB, non-empty.
 * Saves to /home/z/my-project/public/uploads/{ts}-{6-byte-hex}.{ext}.
 * ------------------------------------------------------------------------- */

export const runtime = 'nodejs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const PUBLIC_PREFIX = '/uploads/';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

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

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
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

/**
 * Persist a raw Buffer to disk and return the public metadata.
 * Throws on write failure.
 */
async function saveBuffer(
  buf: Buffer,
  mime: string,
  originalName: string,
): Promise<SavedFile> {
  await ensureUploadDir();

  const ext = ALLOWED[mime.toLowerCase()];
  if (!ext) {
    // Should have been validated already, but guard anyway.
    throw new Error(`Unsupported MIME type: ${mime}`);
  }

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

/** Extract MIME + base64 payload from a `data:image/png;base64,XXXX` URL. */
function parseDataUrl(dataUrl: string): { mime: string; buf: Buffer } | null {
  const match = /^data:([^;,]+)(?:;([^;,]+))?,(.+)$/.exec(dataUrl.trim());
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const encoding = match[2] || 'base64';
  const payload = match[3];
  if (encoding !== 'base64') return null;
  try {
    const buf = Buffer.from(payload, 'base64');
    return { mime, buf };
  } catch {
    return null;
  }
}

/** Validate a single image buffer: MIME type + size + non-empty. */
function validateImage(
  mime: string,
  buf: Buffer,
  originalName: string,
): NextResponse | null {
  if (!mime || !ALLOWED[mime.toLowerCase()]) {
    return errorResponse(
      415,
      `Unsupported file type: ${mime || 'unknown'}. Allowed: jpeg, png, webp, gif.`,
      { originalName },
    );
  }
  if (!buf || buf.byteLength === 0) {
    return errorResponse(400, 'File is empty.', { originalName });
  }
  if (buf.byteLength > MAX_BYTES) {
    return errorResponse(
      413,
      `File too large (${buf.byteLength} bytes). Max ${MAX_BYTES} bytes (5 MB).`,
      { originalName },
    );
  }
  return null;
}

// GET /api/upload — quick API discovery info.
export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: '/api/upload',
    methods: ['GET', 'POST'],
    description:
      'Upload a single image. Accepts multipart/form-data (file field) OR application/json ({ image: dataUrl }).',
    constraints: {
      maxBytes: MAX_BYTES,
      allowedTypes: Object.keys(ALLOWED),
    },
  });
}

// POST /api/upload — receive a single file (multipart OR base64 JSON).
export async function POST(req: NextRequest) {
  const rateLimited = checkRateLimit(req, RATE_LIMITS.upload);
  if (rateLimited) return rateLimited;

  const contentType = (req.headers.get('content-type') || '').toLowerCase();

  try {
    // ---------- Case 1: application/json with base64 data URL ----------
    if (contentType.includes('application/json')) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse(400, 'Invalid JSON body.');
      }

      if (!body || typeof body !== 'object') {
        return errorResponse(400, 'Invalid JSON body.');
      }
      const { image } = body as { image?: unknown };
      if (typeof image !== 'string' || !image.trim()) {
        return errorResponse(400, 'Missing `image` field (expected data URL).');
      }

      const parsed = parseDataUrl(image);
      if (!parsed) {
        return errorResponse(400, 'Invalid data URL. Expected data:image/...;base64,....');
      }

      const bad = validateImage(parsed.mime, parsed.buf, 'base64-image');
      if (bad) return bad;

      const saved = await saveBuffer(parsed.buf, parsed.mime, 'base64-image');
      return NextResponse.json({ success: true, ...saved });
    }

    // ---------- Case 2: multipart/form-data ----------
    if (contentType.includes('multipart/form-data')) {
      let form: FormData;
      try {
        form = await req.formData();
      } catch {
        return errorResponse(400, 'Invalid multipart body.');
      }

      const file = form.get('file');
      if (!file) {
        return errorResponse(400, 'No file provided. Use field name `file`.');
      }
      if (!(file instanceof File)) {
        return errorResponse(400, '`file` field must be a file.');
      }
      if (file.size === 0) {
        return errorResponse(400, 'File is empty.');
      }

      const mime = (file.type || '').toLowerCase();
      const buf = Buffer.from(await file.arrayBuffer());

      const bad = validateImage(mime, buf, file.name || 'upload');
      if (bad) return bad;

      const saved = await saveBuffer(buf, mime, file.name || 'upload');
      return NextResponse.json({ success: true, ...saved });
    }

    // ---------- Unsupported content type ----------
    return errorResponse(
      400,
      'Unsupported Content-Type. Use multipart/form-data or application/json.',
    );
  } catch (err) {
    console.error('[upload/POST] error', err);
    return errorResponse(500, 'Failed to write file to disk.');
  }
}
