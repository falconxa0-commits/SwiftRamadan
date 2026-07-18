import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import { publicUserFields } from '@/lib/profile-update';

// GET /api/user?email=... — Get user by email
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const email = auth.email || searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email query parameter is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Use publicUserFields to strip financial data for non-owners
    const safeUser = publicUserFields(user, auth.userId);

    return NextResponse.json({
      success: true,
      user: {
        ...safeUser,
        // Mask account number for security
        accountNumber: user.accountNumber ? '****' + user.accountNumber.slice(-4) : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('User API GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/user' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/user — Update user profile
export async function PUT(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const email = auth.email || body.email;
    const { action } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Handle switch-role action
    if (action === 'switch-role') {
      const { role } = body;
      if (!role || !['customer', 'vendor', 'rider'].includes(role)) {
        return NextResponse.json(
          { success: false, message: 'Invalid role. Must be customer, vendor, or rider.' },
          { status: 400 }
        );
      }

      const user = await db.user.update({
        where: { email },
        data: { role },
      });

      return NextResponse.json({
        success: true,
        message: `Role switched to ${role}`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          riderOnline: user.riderOnline,
          vendorOnline: user.vendorOnline,
        },
      });
    }

    // General profile update
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'phone', 'area', 'avatar', 'onboardingComplete',
      'storeName', 'businessCategory', 'businessAddress',
      'bankName', 'accountNumber', 'openTime', 'closeTime',
      'vehicleType', 'plateNumber', 'licenseNumber', 'vehicleColor',
      'riderBankName', 'riderAccountNumber',
      'dailyStreak',
      'riderOnline', 'vendorOnline',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { email },
      data: updateData,
    });

    // Owner is updating their own profile — include financial fields
    const safeUser = publicUserFields(user, auth.userId);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: safeUser,
    });
  } catch (error) {
    console.error('User API PUT error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/user' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to update user' },
      { status: 500 }
    );
  }
}
