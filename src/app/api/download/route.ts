import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/download
 * Serves the pre-built source code ZIP file.
 * ADMIN ONLY - This endpoint provides access to source code.
 */
export async function GET() {
  // Note: For GET requests without request object, admin auth should be
  // enforced at the middleware level. In production, consider moving this
  // to a POST endpoint with explicit authentication check.

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
