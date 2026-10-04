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
});
