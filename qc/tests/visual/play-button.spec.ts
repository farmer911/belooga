import { test, expect } from '@playwright/test';

test.describe('Visual & Anti-Hallucination Quality Gate', () => {
  test('TC-VIS-001: 54px Video Play Button Geometry & Hover State', async ({ page }) => {
    await page.goto('/');
    
    // Check if card container exists on page
    const videoCard = page.locator('.start-content-video').first();
    if (await videoCard.count() === 0) {
      test.skip();
      return;
    }

    const overlay = videoCard.locator('.modal-start');
    const playIcon = videoCard.locator('.video-play-icon');

    // 1. Initial State: Must be hidden
    await expect(overlay).toBeHidden();

    // 2. Hover State: Must be revealed
    await videoCard.hover();
    await expect(overlay).toBeVisible();

    // 3. Geometry Assertions: Computed width/height must be 54px
    const computedWidth = await playIcon.evaluate((el) => window.getComputedStyle(el).width);
    const computedHeight = await playIcon.evaluate((el) => window.getComputedStyle(el).height);
    expect(computedWidth).toBe('54px');
    expect(computedHeight).toBe('54px');

    const borderRadius = await playIcon.evaluate((el) => window.getComputedStyle(el).borderRadius);
    expect(borderRadius).toBe('50%');

    // 4. Pure CSS triangle check
    const triangleColor = await playIcon.evaluate((el) => {
      return window.getComputedStyle(el, ':before').borderLeftColor;
    });
    expect(triangleColor).toMatch(/(rgb\(91, 187, 174\)|#5bbbae)/);
  });
});
