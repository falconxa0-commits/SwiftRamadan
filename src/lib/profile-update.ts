/**
 * Shared profile update logic used by both /api/auth (update-profile action)
 * and /api/user (PUT). Ensures consistent allowed fields and security checks.
 */

// Fields that can be modified via profile update
export const PROFILE_ALLOWED_FIELDS = [
  'name', 'phone', 'area', 'avatar', 'onboardingComplete',
  'storeName', 'businessCategory', 'businessAddress',
  'bankName', 'accountNumber', 'openTime', 'closeTime',
  'vehicleType', 'plateNumber', 'licenseNumber', 'vehicleColor',
  'riderBankName', 'riderAccountNumber',
  'dailyStreak', 'riderOnline', 'vendorOnline',
] as const;

// Fields that must NEVER be modified via profile update (server-authoritative)
export const PROFILE_BLOCKED_FIELDS = [
  'role', 'hasanatPoints', 'swiftPoints', 'loyaltyTier',
] as const;

/**
 * Filter a raw request body to extract only the allowed update fields.
 * Returns { updateData, blockedAttempts } where blockedAttempts lists
 * any server-authoritative fields the caller tried to modify.
 */
export function filterProfileFields(
  body: Record<string, unknown>,
): {
  updateData: Record<string, unknown>;
  blockedAttempts: string[];
} {
  const updateData: Record<string, unknown> = {};
  const blockedAttempts: string[] = [];

  for (const field of PROFILE_BLOCKED_FIELDS) {
    if (body[field] !== undefined) {
      blockedAttempts.push(field);
    }
  }

  for (const field of PROFILE_ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  return { updateData, blockedAttempts };
}

// Fields that are financial/loyalty data and should only be visible to the owner
const FINANCIAL_FIELDS = [
  'hasanatPoints',
  'swiftPoints',
  'loyaltyTier',
] as const;

/**
 * Strip a user object down to safe public fields (no password).
 * Used by both auth and user routes for consistent response shape.
 *
 * If `requesterId` is provided and does NOT match `user.id`, financial/loyalty
 * fields (hasanatPoints, swiftPoints, loyaltyTier) are omitted from the
 * response to prevent leaking sensitive data to non-owners.
 */
export function publicUserFields(
  user: Record<string, unknown>,
  requesterId?: string,
) {
  const isOwner = requesterId !== undefined && requesterId === user.id;

  const base = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    area: user.area,
    avatar: user.avatar,
    onboardingComplete: user.onboardingComplete,
    storeName: user.storeName,
    businessCategory: user.businessCategory,
    businessAddress: user.businessAddress,
    bankName: user.bankName,
    accountNumber: user.accountNumber,
    openTime: user.openTime,
    closeTime: user.closeTime,
    vehicleType: user.vehicleType,
    plateNumber: user.plateNumber,
    licenseNumber: user.licenseNumber,
    vehicleColor: user.vehicleColor,
    riderBankName: user.riderBankName,
    riderAccountNumber: user.riderAccountNumber,
    dailyStreak: user.dailyStreak,
    riderOnline: user.riderOnline,
    vendorOnline: user.vendorOnline,
    referralCode: user.referralCode,
  };

  // Only include financial/loyalty fields for the owner
  if (isOwner) {
    return {
      ...base,
      hasanatPoints: user.hasanatPoints,
      swiftPoints: user.swiftPoints,
      loyaltyTier: user.loyaltyTier,
    };
  }

  return base;
}
