import { test, expect } from '@playwright/test';

test.describe('Job Application Tracker (Kanban Board) Quality Gate', () => {
  test('TC-KANBAN-001: Kanban Board landing, header, and 5 columns rendering', async ({ page }) => {
    await page.goto('/workspace/jobs');

    // 1. Assert Header & Breadcrumb
    await expect(page.locator('text=Belooga Workspace')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('text=Job Application Tracker (Kanban)')).toBeVisible();

    // 2. Assert 5 Kanban Columns
    await expect(page.locator('text=Nhắm Mục Tiêu')).toBeVisible();
    await expect(page.locator('text=Đã Tối Ưu CV')).toBeVisible();
    await expect(page.locator('text=Đã Nộp Đơn')).toBeVisible();
    await expect(page.locator('text=Đang Phỏng Vấn')).toBeVisible();
    await expect(page.locator('text=Nhận Offer / Hired')).toBeVisible();

    // 3. Assert Action button
    await expect(page.locator('button:has-text("Thêm Công Việc")')).toBeVisible();
  });

  test('TC-KANBAN-002: Add new job application modal interaction', async ({ page }) => {
    await page.goto('/workspace/jobs');

    // Click "+ Thêm Công Việc"
    await page.click('button:has-text("Thêm Công Việc")');

    // Assert Modal opens
    await expect(page.locator('text=Thêm Công Việc Cần Theo Dõi')).toBeVisible();
    await expect(page.locator('label:has-text("Tên công ty *")')).toBeVisible();
    await expect(page.locator('label:has-text("Vị trí ứng tuyển *")')).toBeVisible();

    // Fill form
    await page.fill('input[placeholder*="Shopee"]', 'VNG Games');
    await page.fill('input[placeholder*="Senior Backend"]', 'Tech Lead Golang');

    // Close modal
    await page.click('button:has-text("Hủy")');
    await expect(page.locator('text=Thêm Công Việc Cần Theo Dõi')).not.toBeVisible();
  });

  test('TC-KANBAN-003: Search input filters job cards', async ({ page }) => {
    await page.goto('/workspace/jobs');

    // Type in search filter
    const searchInput = page.locator('input[placeholder*="Lọc công ty"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('NonExistentJob12345');

    // Columns should show "Chưa có công việc"
    await expect(page.locator('text=Chưa có công việc').first()).toBeVisible();
  });
});
