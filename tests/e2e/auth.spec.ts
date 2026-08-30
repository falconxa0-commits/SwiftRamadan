import { test, expect, type Page } from '@playwright/test';
import { clearAuthState } from './helpers';

/**
 * AUTHENTICATION FLOW — 10 E2E tests
 *
 * Mixes UI tests (welcome screen, login form, signup form, role
 * selection, password-length UI validation, OTP screen) with API
 * tests (email-format validation, phone-format validation, invalid
 * OTP rejection, resend-OTP behaviour).
 *
 * The auth API (`/api/auth`) is in the `alwaysPublicExact` allowlist
 * in `src/lib/session.ts`, so the middleware does NOT 401 these
 * requests — the route handler performs its own validation.
 */

/** Drive the Zustand store's `setShowAuth` from inside the page. */
async function setAuthView(page: Page, view: 'login' | 'signup' | 'otp' | 'role') {
  await page.waitForFunction(
    () => !!(window as unknown as { __swiftramadanStore?: unknown }).__swiftramadanStore,
    undefined,
    { timeout: 10_000 },
  );
  await page.evaluate((v) => {
    const w = window as unknown as {
      __swiftramadanStore?: {
        getState: () => {
          setShowAuth: (v: string | null) => void;
          setShowWelcome: (v: boolean) => void;
          setUserEmail: (v: string) => void;
          setUserPhone: (v: string) => void;
          setShowOnboarding: (v: boolean) => void;
        };
      };
    };
    const s = w.__swiftramadanStore?.getState();
    if (!s) return;
    s.setShowWelcome(false);
    s.setShowOnboarding(false);
    s.setUserEmail('e2e@example.com');
    s.setUserPhone('+2348012345678');
    s.setShowAuth(v);
  }, view);
}

test.describe('Authentication Flow', () => {
  test('should show welcome screen for new users', async ({ page }) => {
    await clearAuthState(page);
    await page.goto('/');

    // WelcomeScreen renders "Sign In" + "Get Started" buttons.
    await expect(page.getByRole('button', { name: /Sign In/i }).first()).toBeVisible({ timeout: 12_000 });
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible();
    // SwiftRamadan brand text should appear.
    await expect(page.getByText(/SwiftRamadan/i).first()).toBeVisible();
  });

  test('should show login form', async ({ page }) => {
    await clearAuthState(page);
    await page.goto('/');

    // Click "Sign In" on the welcome screen.
    await page.getByRole('button', { name: /Sign In/i }).first().click({ timeout: 12_000 });
    await page.waitForTimeout(500);

    // LoginScreen renders the "Welcome Back" h1.
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible({ timeout: 8_000 });

    // The email input is reachable via its placeholder.
    await expect(page.getByPlaceholder(/Email address/i).first()).toBeVisible();
    // The password input via its placeholder.
    await expect(page.getByPlaceholder(/^Password$/i).first()).toBeVisible();
  });

  test('should show signup form', async ({ page }) => {
    await clearAuthState(page);
    await page.goto('/');

    // Click "Get Started" on the welcome screen.
    await page.getByRole('button', { name: /Get Started/i }).first().click({ timeout: 12_000 });
    await page.waitForTimeout(500);

    // SignupScreen renders the "Create Account" h1.
    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible({ timeout: 8_000 });

    // The "Full name" input is the first text field on step 1.
    await expect(page.getByPlaceholder(/Full name/i).first()).toBeVisible();
  });

  test('should show role selection', async ({ page }) => {
    await clearAuthState(page);
    await page.goto('/');

    // Click "Get Started" on the welcome screen.
    await page.getByRole('button', { name: /Get Started/i }).first().click({ timeout: 12_000 });
    await page.waitForTimeout(500);

    // The SignupScreen renders a role tab row at the top with three
    // role labels (Customer / Vendor / Rider).
    await expect(page.getByRole('button', { name: 'Customer' }).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: 'Vendor' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rider' }).first()).toBeVisible();
  });

  // ── API tests: email/phone/password validation happens server-side ──

  test('should validate email format (API rejects invalid email on login)', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: { action: 'login', email: 'not-an-email', password: 'password123' },
    });
    // The inline EMAIL_RE check in the route handler returns 400
    // with "A valid email is required".
    expect(response.status()).toBe(400);
    const body = await response.json().catch(() => ({}));
    expect(body.success).toBeFalsy();
    expect(body.message).toMatch(/valid email/i);
  });

  test('should validate phone format (API rejects short phone on signup)', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: {
        action: 'signup',
        name: 'E2E User',
        email: 'e2e-new@example.com',
        phone: '123', // < 10 chars → fails signupSchema.phone.min(10)
        password: 'password123',
        role: 'customer',
      },
    });
    // The signupSchema validation returns 400 with "Validation error".
    expect(response.status()).toBe(400);
    const body = await response.json().catch(() => ({}));
    expect(body.success).toBeFalsy();
    // The error shape is `{ success, message, errors }` from validateInput().
    expect(body.message).toMatch(/validation error/i);
  });

  test('should validate password length (UI blocks <6 char passwords)', async ({ page }) => {
    await clearAuthState(page);
    await page.goto('/');

    // Open the signup screen.
    await page.getByRole('button', { name: /Get Started/i }).first().click({ timeout: 12_000 });
    await page.waitForTimeout(500);

    // Fill all required step-1 fields with valid data, plus a
    // 4-char password that should fail the length check.
    await page.getByPlaceholder(/Full name/i).first().fill('E2E User');
    await page.getByPlaceholder(/Phone number/i).first().fill('8012345678');
    await page.getByPlaceholder(/Email address/i).first().fill('e2e-shortpw@example.com');

    // Area is a custom dropdown — click to open, then pick "Lekki".
    await page.getByRole('button', { name: /Residential area/i }).first().click({ timeout: 8_000 });
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Lekki', exact: true }).first().click();
    await page.waitForTimeout(300);

    // Type a 4-char password (less than the 6-char minimum).
    await page.getByPlaceholder(/Create password/i).first().fill('1234');

    // Click the "Create Account" button (customer role's step-1 CTA).
    await page.getByRole('button', { name: /Create Account/i }).first().click();
    await page.waitForTimeout(500);

    // The AuthScreen fires a toast with title "Weak password" and
    // description "Password must be at least 6 characters." — the
    // toaster is rendered in the document. We verify the toast text.
    await expect(page.getByText(/Weak password/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('should show OTP verification screen', async ({ page }) => {
    await clearAuthState(page);
    await page.goto('/');

    // The welcome screen renders on first load. Switch the store
    // directly to the OTP view (skipping the signup → API call flow).
    await setAuthView(page, 'otp');
    await page.waitForTimeout(500);

    // OTPScreen renders the "Verify Your Number" h1.
    await expect(page.getByRole('heading', { name: /Verify Your Number/i })).toBeVisible({ timeout: 8_000 });

    // 6 single-digit OTP inputs are rendered.
    const otpInputs = page.locator('input[inputmode="numeric"][maxlength="1"]');
    await expect(otpInputs).toHaveCount(6);
  });

  test('should handle invalid OTP (API rejects unknown 6-digit code)', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: {
        action: 'verify-otp',
        email: 'e2e-unknown@example.com',
        otp: '999999', // 6 digits but no OTP was stored for this email
      },
    });
    // The verify-otp handler returns 401 with "Invalid, expired, or
    // already-used OTP" when verifyOtpAsync returns false.
    expect(response.status()).toBe(401);
    const body = await response.json().catch(() => ({}));
    expect(body.success).toBeFalsy();
    expect(body.message).toMatch(/invalid|expired|already-used/i);
  });

  test('should handle resend OTP (API returns 200 "OTP sent" for valid email)', async ({ request }) => {
    // The send-otp handler succeeds (200) when the email is valid —
    // it generates a fresh OTP and stores it. The notification
    // dispatch failures are swallowed (graceful degradation).
    const response = await request.post('/api/auth', {
      data: {
        action: 'send-otp',
        email: 'e2e-resend@example.com',
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json().catch(() => ({}));
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/OTP sent/i);
  });
});
