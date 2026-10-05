import { test, expect } from '@playwright/test';

test.describe('Jira & Linear Engineering Ticket Board Quality Gate', () => {
  test('TC-TICKETS-001: Page landing, breadcrumbs, and ticket count badges', async ({ page }) => {
    await page.goto('/admin/tickets');

    // 1. Assert Header & Breadcrumb
    await expect(page.locator('text=Belooga Command')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('text=Jira & Linear Engineering Sprint Board')).toBeVisible();

    // 2. Assert Subheader badges
    await expect(page.locator('text=Tickets Phân Bổ')).toBeVisible();
    await expect(page.locator('h3:has-text("Đã Xong & Nghiệm Thu")')).toBeVisible();
  });

  test('TC-TICKETS-002: Assert 3 Kanban Columns (Backlog, In Progress, Done)', async ({ page }) => {
    await page.goto('/admin/tickets');

    // 1. Assert 3 Columns
    await expect(page.locator('text=Backlog & Gán Việc')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('text=Đang Làm Việc Active')).toBeVisible();
    await expect(page.locator('text=Đã Xong & Nghiệm Thu')).toBeVisible();
  });

  test('TC-TICKETS-003: Sprint and Assignee Pod filters interaction', async ({ page }) => {
    await page.goto('/admin/tickets');

    // Filter by Sprint 2
    const btnSprint2 = page.locator('button:has-text("Sprint 2")');
    await expect(btnSprint2).toBeVisible({ timeout: 7000 });
    await btnSprint2.click();

    // Assert Sprint 2 tickets like BEL-201 or BEL-202 are visible
    await expect(page.locator('text=BEL-202')).toBeVisible();

    // Filter by Assignee @be-senior
    const btnBeSenior = page.locator('button:has-text("Backend (@be-senior)")');
    await btnBeSenior.click();
    await expect(page.locator('text=BEL-202')).toBeVisible();
  });

  test('TC-TICKETS-004: Ticket detail modal inspection (User Story & AC)', async ({ page }) => {
    await page.goto('/admin/tickets');

    // Click ticket BEL-103
    const card = page.locator('[data-testid="ticket-card-BEL-103"]');
    await expect(card).toBeVisible({ timeout: 7000 });
    await card.click();

    // Assert Modal opens with Acceptance Criteria
    await expect(page.locator('text=Tiêu Chí Nghiệm Thu (Acceptance Criteria - AC)')).toBeVisible();
    await expect(page.locator('text=Bóc tách kỹ năng < 50ms')).toBeVisible();

    // Close Modal
    await page.click('button:has-text("Đóng")');
    await expect(page.locator('text=Tiêu Chí Nghiệm Thu (Acceptance Criteria - AC)')).not.toBeVisible();
  });
});
