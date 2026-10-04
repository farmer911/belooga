import { chromium } from '@playwright/test';

async function captureEvidence() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['camera', 'microphone'],
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/user/hry...');
  await page.goto('http://localhost:3000/user/hry');
  await page.waitForLoadState('networkidle');

  // 1. Capture Candidate Profile with Auto Thumbnail Poster
  await page.screenshot({
    path: '/Users/phucnguyen/.gemini/antigravity-ide/brain/5e52df0d-5a76-41db-934b-5bce8bdf7dd6/evidence_01_candidate_thumbnail.png',
  });
  console.log('Captured evidence_01_candidate_thumbnail.png');

  // 2. Open Camera Studio
  const studioBtn = page.locator('[data-testid="record-pitch-studio-btn"]');
  await studioBtn.click();
  await page.waitForSelector('[data-testid="studio-live-cam"]');
  await page.waitForTimeout(1000);

  // Capture Live Camera Feed in Studio
  await page.screenshot({
    path: '/Users/phucnguyen/.gemini/antigravity-ide/brain/5e52df0d-5a76-41db-934b-5bce8bdf7dd6/evidence_02_live_camera_studio.png',
  });
  console.log('Captured evidence_02_live_camera_studio.png');

  // 3. Start Recording
  await page.locator('[data-testid="studio-record-btn"]').click();
  await page.waitForTimeout(2000);

  // Capture Recording in Progress
  await page.screenshot({
    path: '/Users/phucnguyen/.gemini/antigravity-ide/brain/5e52df0d-5a76-41db-934b-5bce8bdf7dd6/evidence_03_recording_in_progress.png',
  });
  console.log('Captured evidence_03_recording_in_progress.png');

  // 4. Stop Recording & Review
  await page.locator('[data-testid="studio-stop-btn"]').click();
  await page.waitForSelector('[data-testid="studio-save-btn"]');
  await page.waitForTimeout(500);

  // Capture Review Preview & Save Button
  await page.screenshot({
    path: '/Users/phucnguyen/.gemini/antigravity-ide/brain/5e52df0d-5a76-41db-934b-5bce8bdf7dd6/evidence_04_recorded_review_ready.png',
  });
  console.log('Captured evidence_04_recorded_review_ready.png');

  await browser.close();
  console.log('Evidence capture complete!');
}

captureEvidence().catch((err) => {
  console.error('Error capturing evidence:', err);
  process.exit(1);
});
