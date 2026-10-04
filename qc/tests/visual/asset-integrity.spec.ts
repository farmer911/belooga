import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

test.describe('Asset Integrity & Zero Broken Links Gate', () => {
  test('TC-VIS-002: Verify zero broken images and literal brand logo resolution', async ({ page }) => {
    const basePage = new BasePage(page);
    const failedImageUrls: string[] = [];

    page.on('response', (response) => {
      if (
        response.status() >= 400 &&
        response.request().resourceType() === 'image'
      ) {
        failedImageUrls.push(response.url());
      }
    });

    await basePage.goto('/');
    await basePage.expectHeaderVisible();

    expect(failedImageUrls).toEqual([]);
  });
});
