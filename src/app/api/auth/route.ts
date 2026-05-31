import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, phone, name, otp, password, role, area, avatar,
            storeName, businessCategory, businessAddress, bankName, accountNumber,
            openTime, closeTime, vehicleType, plateNumber, licenseNumber,
            vehicleColor, riderBankName, riderAccountNumber } = body;

    switch (action) {
      case 'login': {
        if (!email || !password) {
          return NextResponse.json(
            { success: false, message: 'Email and password are required' },
            { status: 400 }
          );
        }

        const user = await db.user.findUnique({ where: { email } });

        if (!user) {
          return NextResponse.json(
            { success: false, message: 'No account found with this email' },
            { status: 404 }
          );
        }

        if (user.password && user.password !== password) {
          return NextResponse.json(
            { success: false, message: 'Incorrect password' },
            { status: 401 }
          );
        }

        const token = `sr_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        return NextResponse.json({
          success: true,
          message: 'Login successful',
          user: {
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
            vehicleType: user.vehicleType,
            plateNumber: user.plateNumber,
            hasanatPoints: user.hasanatPoints,
            swiftPoints: user.swiftPoints,
            loyaltyTier: user.loyaltyTier,
            dailyStreak: user.dailyStreak,
            riderOnline: user.riderOnline,
            vendorOnline: user.vendorOnline,
          },
          token,
        });
      }

      case 'signup': {
        if (!name || !email) {
          return NextResponse.json(
            { success: false, message: 'Name and email are required' },
            { status: 400 }
          );
        }

        const existing = await db.user.findUnique({ where: { email } });
        if (existing) {
          return NextResponse.json(
            { success: false, message: 'An account with this email already exists' },
            { status: 409 }
          );
        }

        const user = await db.user.create({
          data: {
            name,
            email,
            phone: phone || '',
            password: password || '',
            role: role || 'customer',
            area: area || '',
            avatar: avatar || '',
            storeName: storeName || null,
            businessCategory: businessCategory || null,
            businessAddress: businessAddress || null,
            bankName: bankName || null,
            accountNumber: accountNumber || null,
            openTime: openTime || '08:00',
            closeTime: closeTime || '22:00',
            vehicleType: vehicleType || null,
            plateNumber: plateNumber || null,
            licenseNumber: licenseNumber || null,
            vehicleColor: vehicleColor || null,
            riderBankName: riderBankName || null,
            riderAccountNumber: riderAccountNumber || null,
          },
        });

        const token = `sr_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        return NextResponse.json({
          success: true,
          message: 'Account created. Please verify your phone number.',
          user: {
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
            vehicleType: user.vehicleType,
            plateNumber: user.plateNumber,
            hasanatPoints: user.hasanatPoints,
            swiftPoints: user.swiftPoints,
            loyaltyTier: user.loyaltyTier,
            dailyStreak: user.dailyStreak,
          },
          token,
        });
      }

      case 'verify-otp': {
        if (!email || !otp) {
          return NextResponse.json(
            { success: false, message: 'Email and OTP are required' },
            { status: 400 }
          );
        }

        // Mock OTP verification - accept any 6-digit code
        if (!/^\d{6}$/.test(otp)) {
          return NextResponse.json(
            { success: false, message: 'Invalid OTP code. Must be 6 digits.' },
            { status: 400 }
          );
        }

        // Mark user as verified (onboardingComplete could also be set later)
        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Phone number verified successfully',
          verified: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            onboardingComplete: user.onboardingComplete,
          },
        });
      }

      case 'get-user': {
        if (!email) {
          return NextResponse.json(
            { success: false, message: 'Email is required' },
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

        return NextResponse.json({
          success: true,
          user: {
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
            hasanatPoints: user.hasanatPoints,
            swiftPoints: user.swiftPoints,
            loyaltyTier: user.loyaltyTier,
            dailyStreak: user.dailyStreak,
            riderOnline: user.riderOnline,
            vendorOnline: user.vendorOnline,
          },
        });
      }

      case 'update-profile': {
        if (!email) {
          return NextResponse.json(
            { success: false, message: 'Email is required' },
            { status: 400 }
          );
        }

        const updateData: Record<string, unknown> = {};
        const allowedFields = [
          'name', 'phone', 'area', 'avatar', 'onboardingComplete',
          'storeName', 'businessCategory', 'businessAddress',
          'bankName', 'accountNumber', 'openTime', 'closeTime',
          'vehicleType', 'plateNumber', 'licenseNumber', 'vehicleColor',
          'riderBankName', 'riderAccountNumber',
          'hasanatPoints', 'swiftPoints', 'loyaltyTier', 'dailyStreak',
          'riderOnline', 'vendorOnline',
        ];

        for (const field of allowedFields) {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        }

        const user = await db.user.update({
          where: { email },
          data: updateData,
        });

        return NextResponse.json({
          success: true,
          message: 'Profile updated successfully',
          user: {
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
            hasanatPoints: user.hasanatPoints,
            swiftPoints: user.swiftPoints,
            loyaltyTier: user.loyaltyTier,
            dailyStreak: user.dailyStreak,
            riderOnline: user.riderOnline,
            vendorOnline: user.vendorOnline,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action. Use login, signup, verify-otp, get-user, or update-profile.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
