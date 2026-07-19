import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
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
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}
