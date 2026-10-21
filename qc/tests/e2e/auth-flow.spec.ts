import { test, expect } from '@playwright/test';

test.describe('Authentication & Security Quality Gate', () => {
  test('TC-AUTH-001: Real-time availability check and end-to-end candidate registration', async ({ page }) => {
    await page.goto('/register');

    // 1. Fill basic personal names
    await page.fill('input[placeholder="Jane"]', 'Sarah');
    await page.fill('input[placeholder="Doe"]', 'Connor');

    // 2. Test already taken username
    const usernameInput = page.locator('input[placeholder="janedoe"]');
    await usernameInput.fill('alexnguyen');
    
    // Assert "Already taken" badge displays after 300ms debounce
    const takenBadge = page.locator('text=Already taken');
    await expect(takenBadge).toBeVisible({ timeout: 5000 });

    // 3. Test unique available username
    const uniqueUsername = `candidate_${Date.now()}`;
    await usernameInput.fill(uniqueUsername);
    const availableBadge = page.locator('text=Available');
    await expect(availableBadge).toBeVisible({ timeout: 5000 });

    // 4. Fill email and password
    const uniqueEmail = `test_${Date.now()}@belooga.com`;
    await page.fill('input[placeholder="jane@example.com"]', uniqueEmail);
    const validEmailBadge = page.locator('text=Valid');
    await expect(validEmailBadge).toBeVisible({ timeout: 5000 });

    await page.fill('input[placeholder="••••••••"]', 'SecurePassword123!');

    // 5. Consent to terms & Submit
    await page.check('input#terms');
    await page.click('button[type="submit"]');

    // 6. Assert successful redirect to candidate workspace
    await expect(page).toHaveURL(new RegExp(`/user/${uniqueUsername}`), { timeout: 10000 });
  });

  test('TC-AUTH-002: Login flow & client-side zero-token leakage verification', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'alex@belooga.com');
    await page.fill('input[type="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');

    // Assert redirected to candidate workspace for alexnguyen
    await expect(page).toHaveURL(/.*\/user\/alexnguyen/, { timeout: 10000 });

    // Security Gate: Assert zero raw JWT or tokens in localStorage / sessionStorage
    const leakedLocalStorage = await page.evaluate(() => {
      const keys = ['token', 'access_token', 'oauth_token', 'jwt', 'auth'];
      return keys.filter((k) => localStorage.getItem(k) !== null);
    });
    expect(leakedLocalStorage).toEqual([]);

    const leakedSessionStorage = await page.evaluate(() => {
      const keys = ['token', 'access_token', 'oauth_token', 'jwt', 'auth'];
      return keys.filter((k) => sessionStorage.getItem(k) !== null);
    });
    expect(leakedSessionStorage).toEqual([]);
  });

  test('TC-AUTH-003: Password recovery token issuance and single-use reset flow (/forgot-password)', async ({ page }) => {
    await page.goto('/forgot-password');

    const form = page.locator('[data-testid="forgot-password-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });

    await page.fill('input[type="email"]', 'admin@belooga.com');
    await page.click('button:has-text("Send Reset Link")');

    // Assert recovery token step appears
    const resetStep = page.locator('[data-testid="reset-password-form"]');
    await expect(resetStep).toBeVisible({ timeout: 5000 });

    // Fill new password (resetToken is auto-populated in non-production)
    await page.fill('input[placeholder="New password (min 8 chars)"]', 'AdminSecret123!');
    await page.click('button:has-text("Confirm New Password")');

    await expect(page.locator('[data-testid="password-reset-success"]')).toBeVisible({ timeout: 5000 });
  });

  test('TC-AUTH-004: Account settings notification preferences & email verification UI (/user/[username]/settings)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alex@belooga.com');
    await page.fill('input[type="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/user\/alexnguyen/, { timeout: 10000 });

    await page.locator('a[href="/user/alexnguyen/settings"]').first().click();
    await expect(page.locator('[data-testid="settings-password-form"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="settings-notification-prefs"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-email-verification"]')).toBeVisible();

    // Trigger email verification request & verify token
    await page.locator('[data-testid="request-email-verify-btn"]').click();
    const tokenInput = page.locator('[data-testid="verify-email-token-input"]');
    await expect(tokenInput).not.toHaveValue('', { timeout: 5000 });
    await page.locator('[data-testid="confirm-email-verify-btn"]').click();
    await expect(page.locator('[data-testid="email-verified-badge"]')).toBeVisible({ timeout: 5000 });
  });

  test('TC-AUTH-005: Protected route guard blocks unauthenticated visitors and enforces owner IDOR redirect', async ({ page }) => {
    // 1. Unauthenticated access to private workspace, update, and settings must redirect to /login?next=...
    await page.goto('/user/alexnguyen');
    await expect(page).toHaveURL(/.*\/login\?next=%2Fuser%2Falexnguyen/, { timeout: 7000 });

    await page.goto('/user/alexnguyen/update');
    await expect(page).toHaveURL(/.*\/login\?next=%2Fuser%2Falexnguyen%2Fupdate/, { timeout: 7000 });

    await page.goto('/user/alexnguyen/settings');
    await expect(page).toHaveURL(/.*\/login\?next=%2Fuser%2Falexnguyen%2Fsettings/, { timeout: 7000 });

    // 2. Logging in on /login?next=%2Fuser%2Falexnguyen%2Fsettings redirects directly back to /user/alexnguyen/settings
    await page.fill('input[type="email"]', 'alex@belooga.com');
    await page.fill('input[type="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/user\/alexnguyen\/settings/, { timeout: 10000 });

    // 3. Authenticated user attempting to access another user's private workspace is redirected to /public/[other]
    await page.goto('/user/othercandidate/settings');
    await expect(page).toHaveURL(/.*\/public\/othercandidate/, { timeout: 7000 });
  });
});
