import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, phone, name, otp, password } = body;

    // Import z-ai-web-dev-sdk dynamically (server-side only)
    const sdk = await import('z-ai-web-dev-sdk');

    switch (action) {
      case 'login': {
        if (!email || !password) {
          return NextResponse.json(
            { success: false, message: 'Email and password are required' },
            { status: 400 }
          );
        }

        // Mock login - in production, verify against database
        const mockToken = `sr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const mockUser = {
          id: `user_${Date.now()}`,
          name: name || email.split('@')[0],
          email,
          phone: phone || '+2348000000000',
          role: 'customer',
          token: mockToken,
        };

        return NextResponse.json({
          success: true,
          message: 'Login successful',
          user: mockUser,
          token: mockToken,
        });
      }

      case 'signup': {
        if (!name || !phone || !email) {
          return NextResponse.json(
            { success: false, message: 'Name, phone, and email are required' },
            { status: 400 }
          );
        }

        // Mock signup - in production, create user in database
        const mockToken = `sr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const mockUser = {
          id: `user_${Date.now()}`,
          name,
          email,
          phone,
          role: 'customer',
          token: mockToken,
        };

        // Mock OTP - in production, send via SMS
        const mockOtp = '123456';

        return NextResponse.json({
          success: true,
          message: 'Account created. Please verify your phone number.',
          user: mockUser,
          otp: mockOtp, // Only in development!
          token: mockToken,
        });
      }

      case 'verify-otp': {
        if (!phone || !otp) {
          return NextResponse.json(
            { success: false, message: 'Phone number and OTP are required' },
            { status: 400 }
          );
        }

        // Mock OTP verification - accept any 6-digit code
        if (otp.length !== 6) {
          return NextResponse.json(
            { success: false, message: 'Invalid OTP code' },
            { status: 400 }
          );
        }

        // In production, verify against stored OTP
        return NextResponse.json({
          success: true,
          message: 'Phone number verified successfully',
          verified: true,
        });
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action. Use login, signup, or verify-otp.' },
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
