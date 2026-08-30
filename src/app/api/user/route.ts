import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import * as usersService from '@/services/users/users.service';
import * as authService from '@/services/auth/auth.service';

// GET /api/user — Get the authenticated user's profile
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    // MIGRATED (Phase 6.1): inline `db.user.findUnique({ where: { email } })`
    // replaced with `usersService.getUserById(auth.userId)`. This also
    // tightens behaviour: the previous `?email=` query-param fallback could
    // be used to read another user's public profile by email; the service
    // call is keyed solely on the authenticated user's ID, so the response
    // is always the caller's own profile. The service applies
    // `publicUserFields(user, userId)` internally (owner view — financial
    // fields included), matching the previous `publicUserFields(user, auth.userId)`
    // behaviour.
    //
    // Response shape note: the previous handler also returned `createdAt`
    // and `updatedAt`. Those fields are not part of `PublicUser` (the
    // service's return type) and are omitted here. No frontend consumer in
    // this repo reads them from this endpoint.
    const safeUser = await usersService.getUserById(auth.userId);

    if (!safeUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Preserve the account-number masking that the previous handler applied
    // on top of `publicUserFields`.
    return NextResponse.json({
      success: true,
      user: {
        ...safeUser,
        accountNumber: safeUser.accountNumber
          ? '****' + String(safeUser.accountNumber).slice(-4)
          : null,
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

      // MIGRATED (Phase 10 Alpha): inline `db.user.update({ where: { email },
      // data: { role } })` replaced with `authService.switchRole`. This
      // closes the previous security gap (audit B2/B3) where this path
      // allowed ANY authenticated user to upgrade themselves to vendor or
      // rider without admin approval — unlike `/api/auth` switch-role
      // which enforced the admin-approval rule. The two switch-role
      // endpoints now share the same service-level enforcement.
      //
      // Behaviour change: non-admin users can no longer upgrade to
      // vendor/rider via this endpoint. They can still downgrade to
      // customer. Admins retain full upgrade authority. This matches
      // the `/api/auth` switch-role behaviour that the frontend already
      // uses (AuthScreen.tsx calls `/api/auth`, not `/api/user`).
      //
      // The service keys the update on `auth.userId` (not `body.email`),
      // so the previous `body.email` fallback that allowed switching
      // another user's role by email is no longer available — only the
      // authenticated user can switch their own role via this endpoint.
      let updatedUser;
      try {
        updatedUser = await authService.switchRole(
          auth.userId,
          role as 'customer' | 'vendor' | 'rider',
          auth.role,
        );
      } catch (err) {
        if (err instanceof Error && err.message === 'FORBIDDEN') {
          return NextResponse.json(
            {
              success: false,
              message:
                'Role upgrade requires admin approval. Please submit a vendor/rider application via your profile settings.',
            },
            { status: 403 }
          );
        }
        if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }
        if (err instanceof Error && err.message === 'INVALID_ROLE') {
          return NextResponse.json(
            { success: false, message: 'Invalid role. Must be customer, vendor, or rider.' },
            { status: 400 }
          );
        }
        throw err;
      }

      return NextResponse.json({
        success: true,
        message: `Role switched to ${role}`,
        user: {
          id: String(updatedUser.id),
          name: String(updatedUser.name),
          email: String(updatedUser.email),
          role: String(updatedUser.role),
          riderOnline: Boolean(updatedUser.riderOnline),
          vendorOnline: Boolean(updatedUser.vendorOnline),
        },
      });
    }

    // General profile update
    // MIGRATED (Phase 10): inline `db.user.update({ where: { email }, data })`
    // replaced with `usersService.updateProfile(auth.userId, body)`. The
    // service applies the same `PROFILE_ALLOWED_FIELDS` allow-list (verified
    // to match the route's previous allow-list exactly) and returns a
    // `PublicUser` (owner view — financial fields included). Behaviour
    // tightening: the service is keyed on `auth.userId` (not `email`), so the
    // previous `body.email` fallback that allowed updating by email is no
    // longer available — only the authenticated user can update their own
    // profile.
    try {
      const safeUser = await usersService.updateProfile(auth.userId, body);
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        user: safeUser,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      if (err instanceof Error && err.message === 'NO_FIELDS') {
        return NextResponse.json(
          { success: false, message: 'No valid fields to update' },
          { status: 400 }
        );
      }
      throw err;
    }
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
