import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { requireAdmin } from '@/lib/admin-auth';
import * as usersService from '@/services/users/users.service';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/export-code
 * Bundles the entire SwiftRamadan source code into a ZIP and streams it back.
 * REQUIRES ADMIN AUTHENTICATION - this endpoint exposes source code.
 * Excludes: node_modules, .next, .git, build artifacts, screenshots, logs.
 * Includes: src/, prisma/, public/ (with food images), mini-services/, config files.
 */
export async function GET(request: NextRequest) {
  // SECURITY FIX: Actually enforce admin authentication (audit B6).
  // Previously requireAdmin was imported but NEVER called, allowing any
  // authenticated user to download the entire source code.
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  // MIGRATED (Phase 11): defense-in-depth admin user existence check via
  // `usersService.getUserById`. `requireAdmin` verifies the JWT and admin
  // role but does NOT verify the user still exists in the DB. Returns a
  // clean 404 instead of letting the source-code export proceed with
  // stale auth state. Mirrors `/api/admin/dashboard/route.ts`.
  const adminUser = await usersService.getUserById(adminCheck.userId);
  if (!adminUser) {
    return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
  }

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
      '*.env',
      '.env*',
    ]
      .map((p) => `-x "${p}"`)
      .join(' ');

    // Sanitize projectRoot to prevent command injection via directory path
    const sanitizedRoot = projectRoot.replace(/[^a-zA-Z0-9\/\_\-\.\~]/g, '');
    
    const cmd = `cd "${sanitizedRoot}" && zip -r -q "${zipPath}" . ${excludeArgs}`;

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

    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to export source code. Please contact support.' },
      { status: 500 }
    );
  }
}
