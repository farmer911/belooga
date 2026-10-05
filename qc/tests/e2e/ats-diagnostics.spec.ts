import { test, expect } from '@playwright/test';

test.describe('ATS Diagnostics & Bot-Eye Dual Screen Quality Gate', () => {
  test('TC-ATS-001: Page landing, Zero Dead-Space header, and preset quick loaders', async ({ page }) => {
    await page.goto('/ats-diagnostics');

    // 1. Assert Header & Breadcrumb
    await expect(page.locator('text=Belooga Studio')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('text=ATS Diagnostics & JD Matcher')).toBeVisible();
    await expect(page.locator('text=Zero Dead-Space')).toBeVisible();

    // 2. Assert Presets
    await expect(page.locator('button:has-text("Senior Go @ VNG")')).toBeVisible();
    await expect(page.locator('button:has-text("Frontend Lead @ Shopee")')).toBeVisible();

    // 3. Assert Main action button
    await expect(page.locator('button:has-text("Quét Điểm ATS Ngay")')).toBeVisible();
  });

  test('TC-ATS-002: Scan execution and scorecard breakdown inspection', async ({ page }) => {
    await page.goto('/ats-diagnostics');

    // Click preset
    await page.click('button:has-text("Senior Go @ VNG")');

    // Click Scan
    await page.click('button:has-text("Quét Điểm ATS Ngay")');

    // Assert Scorecard appears
    await expect(page.locator('text=ATS COMPATIBILITY SCORE')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Kỹ Năng Cứng')).toBeVisible();
    await expect(page.locator('text=Số Liệu STAR')).toBeVisible();

    // Assert Missing skills tab
    await expect(page.locator('button:has-text("Từ Khóa Thiếu")')).toBeVisible();
    await expect(page.locator('text=Kỹ năng cốt lõi trong JD nhưng CV chưa có:')).toBeVisible();

    // Click STAR tab
    await page.click('button:has-text("STAR Audit")');
    await expect(page.locator('text=Gợi ý STAR:').first()).toBeVisible();

    // Assert 1-Click monetization CTA
    await expect(page.locator('text=Sửa 29k Qua MoMo')).toBeVisible();
  });

  test('TC-ATS-003: Dual-mode toggle between Visual PDF and Bot-Eye ATS View', async ({ page }) => {
    await page.goto('/ats-diagnostics');

    // Visual mode is active by default
    await expect(page.locator('button:has-text("Visual Document")')).toBeVisible();
    await expect(page.locator('button:has-text("Mắt Bot ATS Nhìn")')).toBeVisible();

    // Switch to Bot-Eye Mode
    await page.click('button:has-text("Mắt Bot ATS Nhìn")');

    // Assert Terminal ATS Inspector appears
    await expect(page.locator('text=[ATS_ENTITY_EXTRACTION_ENGINE_V2]')).toBeVisible();
    await expect(page.locator('text=PARSER_STATUS: OK (100% TEXT EXTRACTED)')).toBeVisible();

    // Switch back to Visual
    await page.click('button:has-text("Visual Document")');
    await expect(page.locator('text=[ATS_ENTITY_EXTRACTION_ENGINE_V2]')).not.toBeVisible();
  });

  test('TC-ATS-004: Cyberpunk ATS flex card modal interaction and link copy', async ({ page }) => {
    await page.goto('/ats-diagnostics');

    // Open Flex card modal
    const flexBtn = page.locator('[data-testid="btn-open-flex-card"]');
    await expect(flexBtn).toBeVisible({ timeout: 7000 });
    await flexBtn.click();

    // Assert Modal and Canvas
    await expect(page.locator('[data-testid="ats-flex-card-canvas"]')).toBeVisible();
    await expect(page.locator('text=BELOOGA AGENTIC VERIFIED')).toBeVisible();
    await expect(page.locator('[data-testid="flex-score-value"]')).toBeVisible();

    // Click Copy Link
    await page.click('button:has-text("Copy Link Flex Điểm")');
    await expect(page.locator('text=✓ Đã Copy Link!')).toBeVisible();

    // Close Modal
    await page.click('button:has-text("Đóng")');
    await expect(page.locator('[data-testid="ats-flex-card-canvas"]')).not.toBeVisible();
  });

  test('TC-ATS-005: MoMo Micro-Pass 29k checkout modal and simulated payment flow', async ({ page }) => {
    await page.goto('/ats-diagnostics');

    // Run Scan first
    await page.click('button:has-text("Senior Go @ VNG")');
    await page.click('button:has-text("Quét Điểm ATS Ngay")');

    // Wait for Scorecard
    const payBtn = page.locator('[data-testid="btn-pay-momo-29k"]');
    await expect(payBtn).toBeVisible({ timeout: 10000 });
    await payBtn.click();

    // Assert MoMo QR Dialog opens
    await expect(page.locator('text=Thanh Toán MoMo QR Realtime')).toBeVisible();
    await expect(page.locator('text=29.000 đ')).toBeVisible();
    await expect(page.locator('[data-testid="momo-qr-image"]')).toBeVisible();

    // Click Simulate Payment
    await page.click('[data-testid="btn-simulate-momo-pay"]');

    // Assert Success screen
    await expect(page.locator('text=Thanh Toán Thành Công!')).toBeVisible();
    await expect(page.locator('text=Đã mở khóa tính năng tự động tối ưu form STAR')).toBeVisible();

    // Close Dialog
    await page.click('button:has-text("Tiếp Tục Sử Dụng")');
    await expect(page.locator('text=Thanh Toán MoMo QR Realtime')).not.toBeVisible();
  });
});
