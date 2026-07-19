import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/export-code
 * Bundles the entire SwiftRamadan source code into a ZIP and streams it back.
 * Excludes: node_modules, .next, .git, build artifacts, screenshots, logs.
 * Includes: src/, prisma/, public/ (with food images), mini-services/, config files.
 */
export async function GET() {
  const projectRoot = process.cwd();
  const zipFileName = `swiftramadan-export-${Date.now()}.zip`;
  const zipPath = join(tmpdir(), zipFileName);

  try {
    // Build the zip using system `zip`, excluding heavy / non-source paths.
    // `./*.png` matches ONLY root-level screenshots (stored as ./name.png),
    // NOT public/images/*.png (stored as public/images/name.png).
    const excludeArgs = [
      'node_modules/*',
      'node_modules',
      '.next/*',
      '.next',
      '.git/*',
      '.git',
      'upload/*',
      'download/*',
      'agent-ctx/*',
      '.zscripts/*',
      'skills/*',
      'skills',
      'tool-results/*',
      'tool-results',
      'mini-services/*/node_modules/*',
      'dev.log',
      './*.png',
      'public/preview-*',
      'public/verify-*',
      '*.log',
    ]
      .map((p) => `-x "${p}"`)
      .join(' ');

    const cmd = `cd "${projectRoot}" && zip -r -q "${zipPath}" . ${excludeArgs}`;

    await execAsync(cmd, {
      maxBuffer: 200 * 1024 * 1024,
      timeout: 60_000,
    });

    const fileBuffer = await readFile(zipPath);

    // Clean up temp file (fire-and-forget)
    unlink(zipPath).catch(() => {});

    const dateStr = new Date().toISOString().slice(0, 10);
    const downloadName = `swiftramadan-source-${dateStr}.zip`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[export-code] Error:', error);
    // Clean up on failure
    unlink(zipPath).catch(() => {});

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to export source code', details: message },
      { status: 500 }
    );
  }
}
