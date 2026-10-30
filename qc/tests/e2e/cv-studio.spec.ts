import { test, expect } from '@playwright/test';

// The studio loads the signed-in user's saved draft; reset to the sample template so assertions are state-independent.
async function openWithSample(page: import('@playwright/test').Page) {
  await page.goto('/cv-studio');
  await page.waitForLoadState('networkidle');
  await page.click('button:has-text("Nạp Mẫu Chuẩn")');
  await expect(page.locator('[data-testid="cv-preview-name"]')).toHaveText('NGUYỄN VĂN AN');
}

test.describe('Pro CV Studio (Dynamic UI Adjuster) Quality Gate', () => {
  test.beforeEach(async ({ page }) => {
    // Candidate session: the page requires a signed-in user (sets the HttpOnly refresh cookie)
    const loginRes = await page.request.post('http://localhost:8080/v1/auth/login/', {
      data: { email: 'alex@belooga.com', password: 'SecurePassword123!' },
    });
    expect(loginRes.status()).toBe(200);
  });

  test('TC-CVSTUDIO-001: 3-column layout, sidebar, editor, and preview rendering', async ({ page }) => {
    await openWithSample(page);

    // 1. Assert Header & Breadcrumb
    await expect(page.locator('text=Belooga Studio')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('text=Pro CV Studio (Dynamic UI Adjuster)')).toBeVisible();

    // 2. Assert 3-Column Sections
    await expect(page.locator('text=Cấu Trúc Các Mục')).toBeVisible();
    await expect(page.locator('text=Biên Tập Form STAR Định Lượng')).toBeVisible();
    await expect(page.locator('text=Xem Trước A4 Chuẩn ATS')).toBeVisible();

    // 3. Assert Preview Sheet & Default Content
    const paper = page.locator('[data-testid="cv-preview-paper"]');
    await expect(paper).toBeVisible();
    await expect(page.locator('[data-testid="cv-preview-name"]')).toHaveText('NGUYỄN VĂN AN');
    await expect(page.locator('[data-testid="cv-preview-headline"]')).toContainText('Senior Backend Engineer');
  });

  test('TC-CVSTUDIO-002: STAR editor input synchronization with live preview', async ({ page }) => {
    await openWithSample(page);

    // Change Name in Editor
    const nameInput = page.locator('input[value="NGUYỄN VĂN AN"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('TRẦN THỊ MAI');

    // Assert live preview updates instantly
    await expect(page.locator('[data-testid="cv-preview-name"]')).toHaveText('TRẦN THỊ MAI');

    // Change Headline
    const headlineInput = page.locator('input[value="Senior Backend Engineer | Golang, Distributed Systems & Kubernetes"]');
    await headlineInput.fill('Principal AI Architect | PyTorch & Agentic Systems');
    await expect(page.locator('[data-testid="cv-preview-headline"]')).toHaveText('Principal AI Architect | PyTorch & Agentic Systems');
  });

  test('TC-CVSTUDIO-003: Dynamic typography and auto-fit margin optimization', async ({ page }) => {
    await openWithSample(page);

    // Assert One-Page Snap Indicator is initially on
    await expect(page.locator('[data-testid="snap-indicator"]')).toBeVisible();

    // Click "Tự Động Tối Ưu Lề"
    const autoFitBtn = page.locator('button:has-text("Tự Động Tối Ưu Lề")');
    await expect(autoFitBtn).toBeVisible();
    await autoFitBtn.click();

    // Verify typography changed to optimized compact value
    await expect(page.locator('text=9.6 pt')).toBeVisible();
    await expect(page.locator('text=0.5 in')).toBeVisible();

    // Click "Nạp Mẫu Chuẩn" to reset
    await page.click('button:has-text("Nạp Mẫu Chuẩn")');
    await expect(page.locator('text=10 pt')).toBeVisible();
    await expect(page.locator('text=0.6 in')).toBeVisible();
  });
});
