import { test, expect } from '@playwright/test';

test.describe('Salary Benchmark & Market Skill Radar Quality Gate', () => {
  test('TC-SALARY-001: Page landing, breadcrumbs, and filters rendering', async ({ page }) => {
    await page.goto('/salary-benchmark');

    // 1. Assert Header & Breadcrumb
    await expect(page.locator('text=Belooga Market Radar')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('text=Báo Cáo Tra Cứu Lương IT & Kỹ Năng Giá Trị Cao')).toBeVisible();

    // 2. Assert Filter options
    await expect(page.locator('button:has-text("Golang")')).toBeVisible();
    await expect(page.locator('button:has-text("Python / AI")')).toBeVisible();
    await expect(page.locator('button:has-text("Senior")')).toBeVisible();
  });

  test('TC-SALARY-002: Assert P25, P50, P75 salary pillars and range meter', async ({ page }) => {
    await page.goto('/salary-benchmark');

    // 1. Assert 3 Percentiles
    await expect(page.locator('[data-testid="salary-p25"]')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('[data-testid="salary-p50"]')).toBeVisible();
    await expect(page.locator('[data-testid="salary-p75"]')).toBeVisible();

    // 2. Assert Median Badge
    await expect(page.locator('text=Trung Vị Thị Trường')).toBeVisible();
  });

  test('TC-SALARY-003: Assert Top Paid Skills radar ranking', async ({ page }) => {
    await page.goto('/salary-benchmark');

    // Assert Top Skills Ranking Header
    await expect(page.locator('text=Top Kỹ Năng Kéo Lương Tăng Vọt')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('text=Cần Bổ Sung Vào CV')).toBeVisible();

    // Assert skill items
    await expect(page.locator('text=Apache Kafka')).toBeVisible();
  });

  test('TC-SALARY-004: Filter switching updates stack and benchmark metrics', async ({ page }) => {
    await page.goto('/salary-benchmark');

    // Click "Python / AI"
    const pythonBtn = page.locator('button:has-text("Python / AI")');
    await pythonBtn.click();

    // Assert Title updates to Python
    await expect(page.locator('text=Python / AI — Senior')).toBeVisible();

    // Click "Junior"
    const juniorBtn = page.locator('button:has-text("Junior")');
    await juniorBtn.click();

    // Assert Title updates
    await expect(page.locator('text=Python / AI — Junior')).toBeVisible();
  });
});
