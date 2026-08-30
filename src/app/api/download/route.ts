import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/download
 * Serves the pre-built source code ZIP file.
 * ADMIN ONLY - This endpoint provides access to source code.
 */
export async function GET(request: NextRequest) {
  // SECURITY FIX: Actually enforce admin authentication (audit B7).
  // Previously requireAdmin was imported but NEVER called, allowing any
  // authenticated user to download the entire source code ZIP.
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const filePath = join(process.cwd(), 'public', 'swiftramadan-source.zip');
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    const fileBuffer = readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="swiftramadan-source.zip"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch {
    // Don't expose internal error details
    return NextResponse.json(
      { error: 'Download failed. Please contact support.' },
      { status: 500 }
    );
  }
}
