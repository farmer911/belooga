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
    await expect(page.locator('text=Sarah Jenkins')).toBeVisible();
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
    await expect(page.locator('a[href="/login"]:has-text("Login to Continue")')).toBeVisible();
  });
});
