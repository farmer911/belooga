import { test, expect } from '@playwright/test';

test.describe('Navigation, Ecosystem Dropdown & Theme Toggle Quality Gate', () => {
  test('TC-NAV-001: Exactly ONE header exists across all workspace and tool pages (no duplicate header)', async ({ page }) => {
    const testRoutes = [
      '/',
      '/ats-diagnostics',
      '/salary-benchmark',
      '/cv-studio',
      '/workspace/jobs',
      '/admin/analytics',
    ];

    for (const route of testRoutes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      // Assert only 1 <header> element is rendered
      const headers = page.locator('header');
      await expect(headers).toHaveCount(1);

      // Assert Belooga logo inside header is visible
      const logo = headers.locator('img[alt="Belooga"]');
      await expect(logo).toBeVisible();
    }
  });

  test('TC-NAV-002: Ecosystem dropdown menu opens and links to all tools', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Click "Công Cụ" menu button
    const menuButton = page.locator('button:has-text("Công Cụ")');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Verify all 5 tool links appear
    await expect(page.locator('text=ATS Diagnostics')).toBeVisible();
    await expect(page.locator('text=Tra Cứu Lương IT')).toBeVisible();
    await expect(page.locator('text=Pro CV Studio')).toBeVisible();
    await expect(page.locator('text=Job Tracker')).toBeVisible();
    await expect(page.locator('text=Executive Analytics')).toBeVisible();

    // Navigate to Salary Benchmark via dropdown
    await page.click('text=Tra Cứu Lương IT');
    await page.waitForURL('**/salary-benchmark');
    await expect(page.locator('text=Belooga Market Radar')).toBeVisible();
  });

  test('TC-THEME-001: Theme toggle switches between light and dark mode and saves to localStorage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Initially light mode (no .dark class)
    const htmlElement = page.locator('html');
    const toggleButton = page.locator('header button[title="Chế độ Tối"], header button[title="Chế độ Sáng"]');
    await expect(toggleButton).toBeVisible();

    // Toggle to Dark Mode
    await toggleButton.click();
    await expect(htmlElement).toHaveClass(/dark/);

    const savedTheme = await page.evaluate(() => localStorage.getItem('belooga-theme'));
    expect(savedTheme).toBe('dark');

    // Toggle back to Light Mode
    await toggleButton.click();
    await expect(htmlElement).not.toHaveClass(/dark/);

    const updatedTheme = await page.evaluate(() => localStorage.getItem('belooga-theme'));
    expect(updatedTheme).toBe('light');
  });
});
