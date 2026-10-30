import { test, expect } from '@playwright/test';

test.describe('Expert CV Review & Monetization Quality Gate', () => {
  test('TC-EXREV-001: Expert review page landing, hero, pricing tiers, and sample report', async ({ page }) => {
    await page.goto('/expert-review');

    // 1. Assert Hero section elements
    await expect(page.locator('h1')).toContainText('Get Your CV Reviewed by', { timeout: 7000 });
    await expect(page.locator('text=Top 1% Verified Silicon Valley Mentors')).toBeVisible();
    await expect(page.locator('text=Guaranteed 24-48h Delivery')).toBeVisible();

    // 2. Assert Pricing tiers
    await expect(page.locator('h2:has-text("Choose Your CV Review Plan")')).toBeVisible();
    await expect(page.locator('h3:has-text("Essential Review")')).toBeVisible();
    await expect(page.locator('h3:has-text("Pro Deep-Dive")')).toBeVisible();
    await expect(page.locator('h3:has-text("Elite 1-on-1 Fast-Track")')).toBeVisible();
    await expect(page.locator('text=Most Popular')).toBeVisible();

    // 3. Assert Interactive Sample Report
    await expect(page.locator('h2:has-text("What Your Review Report Looks Like")')).toBeVisible();
    await expect(page.locator('text=CV Health Score: 88 / 100')).toBeVisible();
    await expect(page.locator('text=94%')).toBeVisible(); // ATS score

    // 4. Assert Reviewers section
    await expect(page.locator('h2:has-text("Meet Our Senior Reviewers")')).toBeVisible();
    await expect(page.locator('h3:has-text("Sarah Jenkins")')).toBeVisible();
  });

  test('TC-EXREV-002: Category filtering in expert directory', async ({ page }) => {
    await page.goto('/expert-review');

    // Assert initial directory loaded
    await expect(page.locator('h2:has-text("Meet Our Senior Reviewers")')).toBeVisible({ timeout: 7000 });

    // Click "Frontend & Web" category filter
    await page.click('button:has-text("Frontend & Web")');
    await expect(page.locator('h3:has-text("Alex Chen")')).toBeVisible();

    // Click "AI & Machine Learning" category filter
    await page.click('button:has-text("AI & Machine Learning")');
    await expect(page.locator('h3:has-text("Marcus Vance")')).toBeVisible();
  });

  test('TC-EXREV-003: Review booking modal opens and prompts unauthenticated user', async ({ page }) => {
    await page.goto('/expert-review');

    // Click "Select Pro Deep-Dive" button
    const selectProBtn = page.locator('button:has-text("Select Pro Deep-Dive")').first();
    await expect(selectProBtn).toBeVisible({ timeout: 7000 });
    await selectProBtn.click();

    // Assert Modal opens
    await expect(page.locator('h2:has-text("Book Expert CV Review")')).toBeVisible();
    await expect(page.locator('text=Please login or create a candidate account to order an expert CV review.')).toBeVisible();
    await expect(page.locator('a[href="/login?next=%2Fexpert-review"]:has-text("Login to Continue")')).toBeVisible();
  });

  test('TC-EXREV-004: MoMo IPN rejects forged signatures; payment creation requires a signed-in buyer', async ({ request }) => {
    // 1. Creating a payment is not anonymous
    const anonQr = await request.post('http://localhost:8080/v1/payments/momo/create-qr', {
      data: { package_type: 'MICRO_PASS_29K', order_info: 'ATS pass' },
    });
    expect(anonQr.status()).toBe(401);

    // 2. A forged MoMo IPN (AIO v2 body) is rejected before any order lookup
    const badIpnRes = await request.post('http://localhost:8080/v1/payments/momo/ipn', {
      data: {
        partnerCode: 'MOMO', orderId: 'BLG-E2E-FORGED', requestId: 'BLG-E2E-FORGED', amount: 29000,
        orderInfo: 'ATS pass', orderType: 'momo_wallet', transId: 999888777, resultCode: 0,
        message: 'Successful.', payType: 'qr', responseTime: 1730000000000, extraData: '',
        signature: 'invalid_tampered_signature_000000',
      },
    });
    expect(badIpnRes.status()).toBe(400);
  });
});
