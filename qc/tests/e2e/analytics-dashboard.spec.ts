import { test, expect } from '@playwright/test';

test.describe('Executive Analytics & Monetization Terminal Quality Gate', () => {
  let adminToken = '';

  test.beforeEach(async ({ page }) => {
    // Admin session: the page requires a signed-in user (sets the HttpOnly refresh cookie)
    const loginRes = await page.request.post('http://localhost:8080/v1/auth/login/', {
      data: { email: 'admin@belooga.com', password: 'AdminSecret123!' },
    });
    expect(loginRes.status()).toBe(200);
    const body = await loginRes.json();
    adminToken = body.access_token;
  });

  test('TC-ANALYTICS-001: Analytics dashboard landing, header, and breadcrumb rendering', async ({ page }) => {
    await page.goto('/admin/analytics');

    // 1. Assert Header & Breadcrumb
    await expect(page.locator('span:has-text("Belooga Executive")')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('text=Financial Analytics & Monetization Terminal')).toBeVisible();

    // 2. Assert Subheader badges
    await expect(page.locator('text=Realtime SSOT')).toBeVisible();
    await expect(page.locator('text=P&L Waterfall')).toBeVisible();
  });

  test('TC-ANALYTICS-002: Assert all 6 Financial & Growth KPI Cards', async ({ page }) => {
    await page.goto('/admin/analytics');

    // KPI Cards
    await expect(page.locator('[data-testid="kpi-gmv"]')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('[data-testid="kpi-net-rev"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-escrow"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-infra"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-profit"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-users"]')).toBeVisible();

    // Assert Values presence
    await expect(page.locator('text=Mục Tiêu 500 MAU')).toBeVisible();
    await expect(page.locator('text=Chi Phí Hạ Tầng (COGS)')).toBeVisible();
  });

  test('TC-ANALYTICS-003: Revenue chart, PLG funnel, and MoMo transactions table', async ({ page }) => {
    const orderRes = await page.request.post('http://localhost:8080/v1/expert-review/orders/', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        package_slug: 'pro',
        resume_url: '/uploads/resumes/alex_cv.pdf',
        target_role: 'Staff Full-Stack Engineer',
      },
    });
    expect(orderRes.status()).toBe(201);

    await page.goto('/admin/analytics');

    // Assert Chart Title
    await expect(page.locator('text=Diễn Biến Doanh Thu 7 Ngày Gần Nhất')).toBeVisible({ timeout: 7000 });

    // Assert Funnel
    await expect(page.locator('text=Phễu Chuyển Đổi Tự Nguyện (PLG Conversion Funnel)')).toBeVisible();
    await expect(page.locator('text=1. Khách truy cập & Quét ATS Free')).toBeVisible();

    // Assert Transaction Table
    await expect(page.locator('text=Nhật Ký Giao Dịch MoMo & Escrow Thời Gian Thực')).toBeVisible();
    await expect(page.locator('text=MoMo QR').first()).toBeVisible();
  });

  test('TC-ANALYTICS-004: Time range filter button interaction', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Click 30D
    const btn30D = page.locator('button:has-text("30 Ngày")');
    await expect(btn30D).toBeVisible();
    await btn30D.click();

    // Click Tất Cả
    const btnAll = page.locator('button:has-text("Tất Cả")');
    await btnAll.click();

    // Click back to 7 Ngày
    const btn7D = page.locator('button:has-text("7 Ngày")');
    await btn7D.click();
  });

  test('TC-ANALYTICS-005: Power BI & DuckDB Star-Schema OLAP Connector toggle', async ({ page }) => {
    await page.goto('/admin/analytics');

    const biPanel = page.getByTestId('bi-star-schema-panel');
    await expect(biPanel).toBeVisible({ timeout: 7000 });
    await expect(biPanel).toContainText('belooga-star-v1');

    const toggleBtn = page.getByTestId('btn-copy-powerbi-m');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    const codeBlock = page.getByTestId('bi-query-codeblock');
    await expect(codeBlock).toBeVisible();
    await expect(codeBlock).toContainText('Json.Document(Web.Contents');
    await expect(codeBlock).toContainText('read_json_auto');
  });
});
