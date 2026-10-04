import { test, expect } from '@playwright/test';

test.describe('Public Routes & Full Page E2E Quality Gate', () => {
  test('TC-PUB-001: Public candidate CV read-only security and report modal', async ({ page }) => {
    await page.goto('/public/alexnguyen');

    // Assert public header
    await expect(page.locator('h1:has-text("Alex Nguyen")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Download Resume PDF")')).toBeVisible();

    // Assert report profile modal
    await page.click('button:has-text("Report Profile")');
    await expect(page.locator('h3:has-text("Report Candidate Profile")')).toBeVisible();

    await page.fill('textarea[placeholder*="Describe the issue"]', 'Automated test report feedback.');
    await page.click('button:has-text("Submit Report")');
    await expect(page.locator('text=Report received and sent to moderation team')).toBeVisible();
  });

  test('TC-ROUT-001: Careers page job board rendering', async ({ page }) => {
    await page.goto('/careers');
    await expect(page.locator('h1:has-text("Careers at Belooga")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Staff Full-Stack Engineer')).toBeVisible();
    await expect(page.locator('text=Lead Product Designer')).toBeVisible();
  });

  test('TC-ROUT-002: Help center FAQ accordion expansion', async ({ page }) => {
    await page.goto('/help');
    await expect(page.locator('h1:has-text("Help Center & FAQs")')).toBeVisible({ timeout: 5000 });

    const firstFaq = page.locator('button:has-text("What is the 30-second elevator pitch video?")');
    await expect(firstFaq).toBeVisible();
    await firstFaq.click();
    await expect(page.locator('text=It is an authentic short video')).toBeVisible();
  });

  test('TC-ROUT-003: Contact Us inquiry form submission', async ({ page }) => {
    await page.goto('/contact-us');
    await expect(page.locator('h1:has-text("Contact Belooga Support")')).toBeVisible({ timeout: 5000 });

    await page.fill('input[placeholder="Alex Morgan"]', 'QC Automation Agent');
    await page.fill('input[placeholder="alex@company.com"]', 'qc@belooga.com');
    await page.fill('textarea[placeholder*="How can we help"]', 'Testing full contact API submission from Playwright.');
    await page.click('button:has-text("Send Message")');

    await expect(page.locator('text=Thank you! Your message has been received.')).toBeVisible({ timeout: 5000 });
  });

  test('TC-ROUT-004: Blog list and article slug detail navigation', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1:has-text("Belooga Blog")')).toBeVisible({ timeout: 5000 });

    // Click first article
    await page.click('h3 a:has-text("How to Master Your 30-Second Video Elevator Pitch")');
    await expect(page).toHaveURL(/.*\/blog\/how-to-master-the-30-second-pitch/);
    await expect(page.locator('h1:has-text("How To Master Your 30-Second Video Elevator Pitch")')).toBeVisible();
    await expect(page.locator('text=The Three Pillars of an Effective Pitch')).toBeVisible();
  });

  test('TC-ROUT-005: Legal pages (Privacy Policy & Terms) verification', async ({ page }) => {
    await page.goto('/privacy-policy');
    await expect(page.locator('h1:has-text("Privacy Policy")')).toBeVisible({ timeout: 5000 });

    await page.goto('/terms-and-conditions');
    await expect(page.locator('h1:has-text("Terms and Conditions")')).toBeVisible({ timeout: 5000 });
  });

  test('TC-ROUT-006: 404 Not Found error screen boundary', async ({ page }) => {
    await page.goto('/some-nonexistent-url-404');
    await expect(page.locator('text=404')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h1:has-text("Page Not Found")')).toBeVisible();
    await expect(page.locator('a:has-text("Back to Home")')).toBeVisible();
  });
});
