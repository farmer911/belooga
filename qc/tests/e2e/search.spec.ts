import { test, expect } from '@playwright/test';

test.describe('Talent Discovery & Search Quality Gate', () => {
  test('TC-SRCH-001: Search query string synchronization and candidate results', async ({ page }) => {
    await page.goto('/search');

    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Type query and submit
    await searchInput.fill('Alex');
    await page.locator('button:has-text("Search")').click();

    // Assert URL synchronizes query string
    await expect(page).toHaveURL(/.*\/search\?key=Alex.*/);

    // Assert candidate results list contains Alex Nguyen
    await expect(page.locator('text=Alex Nguyen')).toBeVisible();
    await expect(page.locator('text=0:30 Pitch')).toBeVisible();
  });

  test('TC-SRCH-002: Real-time debounced autocomplete suggestions', async ({ page }) => {
    await page.goto('/search');

    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await searchInput.fill('alex');

    // Wait for 300ms debounce
    const suggestionItem = page.locator('button:has-text("Alex Nguyen")');
    await expect(suggestionItem).toBeVisible({ timeout: 5000 });

    // Click suggestion -> Should navigate to public candidate view
    await suggestionItem.click();
    await expect(page).toHaveURL(/.*\/public\/alexnguyen/);
  });
});
