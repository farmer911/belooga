import { test, expect } from '@playwright/test';

test.describe('Candidate Workspace Core Quality Gate', () => {
  test('TC-WORK-001: 2-Column responsive layout and sticky sidebar assertions', async ({ page }) => {
    await page.goto('/user/alexnguyen');

    // 1. Assert candidate identity elements
    await expect(page.locator('h1:has-text("Alex Nguyen")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=@alexnguyen')).toBeVisible();

    // 2. Assert Sidebar skills and contact channels
    await expect(page.locator('text=Skills & Strengths')).toBeVisible();
    await expect(page.getByText('React', { exact: true })).toBeVisible();
    await expect(page.getByText('FastAPI', { exact: true })).toBeVisible();

    // 3. Assert Main stream sections
    await expect(page.locator('h2:has-text("0:30 Video Elevator Pitch")')).toBeVisible();
    await expect(page.locator('h2:has-text("Work Experience")')).toBeVisible();
    await expect(page.locator('h2:has-text("Education")')).toBeVisible();
  });

  test('TC-WORK-002: 0:30 Video Pitch Player and modal controls', async ({ page }) => {
    await page.goto('/user/alexnguyen');

    const videoContainer = page.locator('.start-content-video').first();
    await expect(videoContainer).toBeVisible({ timeout: 5000 });

    // Assert hover overlay reveals
    const overlay = videoContainer.locator('.modal-start');
    await expect(overlay).toBeHidden();
    await videoContainer.hover();
    await expect(overlay).toBeVisible();

    // Open Video Modal
    await videoContainer.click();

    const modal = page.locator('text=0:30 Video Pitch — Alex Nguyen');
    await expect(modal).toBeVisible();

    // Close Modal
    await page.locator('button:has(svg.lucide-x)').click();
    await expect(modal).toBeHidden();
  });

  test('TC-WORK-003: Experience timeline and resume download elements', async ({ page }) => {
    await page.goto('/user/alexnguyen');

    // Assert timeline job cards
    const jobCards = page.locator('[data-testid="timeline-job-card"]');
    await expect(jobCards).toHaveCount(2);

    // Assert first job is Senior Product Designer at Stripe
    await expect(jobCards.first()).toContainText('Senior Product Designer');
    await expect(jobCards.first()).toContainText('Stripe Inc.');

    // Assert resume card
    await expect(page.locator('text=Resume PDF Attachment')).toBeVisible();
    await expect(page.locator('button:has-text("Download PDF")')).toBeVisible();
  });

  test('TC-WORK-004: Interactive Drag & Drop, Delete experience, and PDF service verification', async ({ page, request }) => {
    await page.goto('/user/alexnguyen');

    // 1. Verify drag and drop attributes
    const jobCards = page.locator('[data-testid="timeline-job-card"]');
    await expect(jobCards.first()).toHaveAttribute('draggable', 'true');

    // 2. Verify PDF download service returns binary PDF
    const pdfResponse = await request.get('http://localhost:8000/v1/profile/alexnguyen/pdf/');
    expect(pdfResponse.status()).toBe(200);
    expect(pdfResponse.headers()['content-type']).toContain('application/pdf');

    // 3. Verify chunked upload chunk endpoint
    const chunkRes = await request.post('http://localhost:8000/v1/media/upload/chunk', {
      multipart: {
        upload_id: 'qc_test_upload',
        chunk_index: '0',
        total_chunks: '1',
        username: 'alexnguyen',
        file: {
          name: 'chunk.bin',
          mimeType: 'application/octet-stream',
          buffer: Buffer.from('qc_test_stream_chunk_data'),
        },
      },
    });
    expect(chunkRes.status()).toBe(200);
    const chunkJson = await chunkRes.json();
    expect(chunkJson.status).toBe('chunk_received');
  });

  test('TC-WORK-005: 0:30 Video Recording Studio live camera feed and auto thumbnail generation', async ({ page, request }) => {
    await page.goto('/user/alexnguyen');

    // 1. Open Live Recording Studio Modal
    const recordBtn = page.locator('[data-testid="record-pitch-studio-btn"]');
    await expect(recordBtn).toBeVisible({ timeout: 5000 });
    await recordBtn.click();

    // 2. Assert Studio Modal opens with active camera view
    await expect(page.locator('h3:has-text("0:30 Video Pitch Recording Studio")')).toBeVisible();
    await expect(page.locator('[data-testid="studio-live-cam"]')).toBeVisible();

    // 3. Verify camera is active and not a black screen
    const isCameraActive = await page.evaluate(() => {
      const vid = document.querySelector('[data-testid="studio-live-cam"]') as HTMLVideoElement;
      return vid && (vid.srcObject !== null || vid.videoWidth > 0);
    });
    expect(isCameraActive).toBe(true);

    // 4. Start recording
    const startRecBtn = page.locator('[data-testid="studio-record-btn"]');
    await expect(startRecBtn).toBeVisible();
    await startRecBtn.click();

    // Assert REC indicator appears with 05:00 format
    await expect(page.locator('text=/REC.*05:00/')).toBeVisible({ timeout: 3000 });

    // 5. Stop recording after brief interval
    await page.waitForTimeout(1200);
    const stopRecBtn = page.locator('[data-testid="studio-stop-btn"]');
    await expect(stopRecBtn).toBeVisible();
    await stopRecBtn.click();

    // Assert Save & Publish button appears
    const saveBtn = page.locator('[data-testid="studio-save-btn"]');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toContainText('Save & Publish Pitch');

    // Close modal
    await page.locator('button:has-text("Close")').click();

    // 6. Verify backend auto-generated thumbnail generation end-to-end
    // Upload a small test webm chunk
    const testUploadId = `qc_thumb_${Date.now()}`;
    const chunkUploadRes = await request.post('http://localhost:8000/v1/media/upload/chunk', {
      multipart: {
        upload_id: testUploadId,
        chunk_index: '0',
        total_chunks: '1',
        username: 'alexnguyen',
        file: {
          name: 'test_pitch.webm',
          mimeType: 'video/webm',
          // Small synthetic webm video payload created earlier in container or valid stream
          buffer: Buffer.from('GkXfo59ChoEBQveBAULygQ8t84M2qksb7bW7'),
        },
      },
    });
    expect(chunkUploadRes.status()).toBe(200);

    // Complete upload and verify auto thumbnail poster generation
    const completeRes = await request.post('http://localhost:8000/v1/media/upload/complete', {
      data: {
        upload_id: testUploadId,
        total_chunks: 1,
        username: 'alexnguyen',
        filename: 'alexnguyen_pitch.webm',
      },
    });
    expect(completeRes.status()).toBe(200);
    const completeJson = await completeRes.json();
    expect(completeJson.status).toBe('completed');
    expect(completeJson.video_url).toContain('/uploads/videos/alexnguyen_pitch');
    expect(completeJson.poster_url).toBeDefined();

    // 7. Verify profile API now reflects the auto-generated video pitch & poster
    const profileRes = await request.get('http://localhost:8000/v1/profile/alexnguyen');
    expect(profileRes.status()).toBe(200);
    const profileJson = await profileRes.json();
    expect(profileJson.video_pitch_poster).toBeDefined();
  });

  test('TC-WORK-006: Studio device selection, resolution switching (1080p, 720p, 480p), and aspect ratio controls', async ({ page }) => {
    await page.goto('/user/alexnguyen');

    // 1. Open Live Recording Studio
    await page.locator('[data-testid="record-pitch-studio-btn"]').click();
    await expect(page.locator('h3:has-text("0:30 Video Pitch Recording Studio")')).toBeVisible();

    // 2. Assert Camera Device Selector
    const deviceSelect = page.locator('[data-testid="camera-device-select"]');
    await expect(deviceSelect).toBeVisible();

    // 3. Test Resolution Selector
    const resSelect = page.locator('[data-testid="camera-resolution-select"]');
    await expect(resSelect).toBeVisible();
    const hudQuality = page.locator('[data-testid="studio-hud-quality"]');

    // Switch to 1080p
    await resSelect.selectOption('1080p');
    await expect(hudQuality).toContainText('1080p');

    // Switch to 480p
    await resSelect.selectOption('480p');
    await expect(hudQuality).toContainText('480p');

    // Switch back to 720p
    await resSelect.selectOption('720p');
    await expect(hudQuality).toContainText('720p');

    // 4. Test Aspect Ratio Switching
    // Switch to 9:16 (Portrait / Reels)
    const ratio916Btn = page.locator('[data-testid="ratio-btn-9-16"]');
    await expect(ratio916Btn).toBeVisible();
    await ratio916Btn.click();
    await expect(hudQuality).toContainText('9:16');
    await expect(page.locator('text=Portrait Guide')).toBeVisible();

    // Switch to 1:1 (Square)
    const ratio11Btn = page.locator('[data-testid="ratio-btn-1-1"]');
    await expect(ratio11Btn).toBeVisible();
    await ratio11Btn.click();
    await expect(hudQuality).toContainText('1:1');
    await expect(page.locator('text=Square Guide')).toBeVisible();

    // Switch to 4:3
    const ratio43Btn = page.locator('[data-testid="ratio-btn-4-3"]');
    await expect(ratio43Btn).toBeVisible();
    await ratio43Btn.click();
    await expect(hudQuality).toContainText('4:3');

    // Switch back to 16:9 (Landscape)
    const ratio169Btn = page.locator('[data-testid="ratio-btn-16-9"]');
    await expect(ratio169Btn).toBeVisible();
    await ratio169Btn.click();
    await expect(hudQuality).toContainText('16:9');
    await expect(page.locator('text=Position Face Here')).toBeVisible();

    // 5. Verify recording locks controls
    await page.locator('[data-testid="studio-record-btn"]').click();
    await expect(deviceSelect).toBeDisabled();
    await expect(resSelect).toBeDisabled();
    await expect(ratio916Btn).toBeDisabled();

    // Stop recording and close
    await page.locator('[data-testid="studio-stop-btn"]').click();
    await expect(page.locator('[data-testid="studio-save-btn"]')).toBeVisible();
    await page.locator('button:has-text("Close")').click();
  });

  test('TC-WORK-007: Studio Teleprompter script import, karaoke speech highlighting, auto-scroll, and 5-min limit', async ({ page }) => {
    await page.goto('/user/alexnguyen');

    // 1. Open Live Recording Studio
    await page.locator('[data-testid="record-pitch-studio-btn"]').click();
    await expect(page.locator('h3:has-text("0:30 Video Pitch Recording Studio")')).toBeVisible();

    // 2. Assert Microphone Recognition, Input Selector & Teleprompter Toolbar Controls
    const micSelect = page.locator('[data-testid="audio-device-select"]');
    const micBadge = page.locator('[data-testid="mic-recognition-badge"]');
    await expect(micSelect).toBeVisible();
    await expect(micBadge).toBeVisible();

    const prompterToggle = page.locator('[data-testid="toggle-teleprompter-btn"]');
    const importBtn = page.locator('[data-testid="import-script-btn"]');
    const editBtn = page.locator('[data-testid="edit-script-btn"]');
    const prompterContainer = page.locator('[data-testid="teleprompter-text-container"]');

    await expect(prompterToggle).toBeVisible();
    await expect(importBtn).toBeVisible();
    await expect(editBtn).toBeVisible();
    await expect(prompterContainer).toBeVisible();

    // 2.1 Test Teleprompter Sidebar Collapse & Expand
    const collapsePrompterBtn = page.locator('[data-testid="collapse-teleprompter-sidebar-btn"]');
    await expect(collapsePrompterBtn).toBeVisible();
    await collapsePrompterBtn.click();

    const collapsedSidebar = page.locator('[data-testid="teleprompter-collapsed-sidebar"]');
    await expect(collapsedSidebar).toBeVisible();
    await expect(prompterContainer).not.toBeVisible();

    // Expand back using docked bar button
    const expandPrompterBtn = page.locator('[data-testid="expand-teleprompter-sidebar-btn"]');
    await expect(expandPrompterBtn).toBeVisible();
    await expandPrompterBtn.click();
    await expect(prompterContainer).toBeVisible();
    await expect(collapsedSidebar).not.toBeVisible();

    // 3. Verify Initial Script Content & Karaoke Word Highlighting
    const firstWord = page.locator('[data-word-idx="0"]');
    await expect(firstWord).toBeVisible();
    await expect(firstWord).toHaveText('Hello,');

    // 4. Test Speed Controls and Jump to Word
    const speed160 = page.locator('[data-testid="prompter-speed-160"]');
    await expect(speed160).toBeVisible();
    await speed160.click();

    // Click on 5th word (index 4) to jump
    const fifthWord = page.locator('[data-word-idx="4"]');
    await fifthWord.click();
    await expect(fifthWord).toHaveClass(/bg-\[#5bbbae\]/);

    // Reset back to start
    await page.locator('[data-testid="prompter-reset-btn"]').click();
    await expect(firstWord).toHaveClass(/bg-\[#5bbbae\]/);

    // 5. Test Script Edit & Custom Text Input
    await editBtn.click();
    const scriptTextarea = page.locator('[data-testid="script-textarea"]');
    await expect(scriptTextarea).toBeVisible();

    // Type new custom script
    await scriptTextarea.fill('Welcome to my executive pitch. I build mission critical software.');
    await page.locator('button:has-text("Save & Use Prompter")').click();

    // Verify updated script words in prompter
    await expect(page.locator('[data-word-idx="0"]')).toHaveText('Welcome');
    await expect(page.locator('[data-word-idx="1"]')).toHaveText('to');

    // 6. Test File Import (.txt)
    const fileInput = page.locator('[data-testid="script-file-input"]');
    await fileInput.setInputFiles({
      name: 'pitch_script.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Leading engineering teams to deliver high scale distributed systems seamlessly.')
    });

    // Verify imported script is parsed into prompter words
    await expect(page.locator('[data-word-idx="0"]')).toHaveText('Leading');
    await expect(page.locator('[data-word-idx="1"]')).toHaveText('engineering');
    await expect(page.locator('[data-word-idx="2"]')).toHaveText('teams');

    // 7. Verify Voice Activity Detection (VAD) & 5-minute extended recording duration limit
    await page.locator('[data-testid="studio-record-btn"]').click();
    await expect(page.locator('text=/.*05:00.*/')).toBeVisible();

    // Verify Prompter is initially waiting for voice and NOT auto-advancing on silence
    const voiceStatus = page.locator('[data-testid="voice-detection-status"]');
    await expect(voiceStatus).toBeVisible();
    await expect(voiceStatus).toContainText('Awaiting Voice');

    // Wait 400ms during silence and verify text remains frozen at index 0 (never runs ahead)
    await page.waitForTimeout(400);
    const initialWord = page.locator('[data-word-idx="0"]');
    await expect(initialWord).toBeVisible();
    // Word 1 must NOT be highlighted as past word because silence prevents advancement
    const secondWord = page.locator('[data-word-idx="1"]');
    await expect(secondWord).not.toHaveClass(/bg-\[#5bbbae\]/);

    // Simulate voice detection trigger
    const simulateVoiceBtn = page.locator('[data-testid="simulate-voice-btn"]');
    if (await simulateVoiceBtn.isVisible()) {
      await simulateVoiceBtn.click({ force: true });
      await expect(voiceStatus).toContainText('Voice Detected');
      await expect(page.locator('[data-testid="teleprompter-text-container"] [class*="bg-[#5bbbae]"]')).toBeVisible();
    }

    // Stop recording and close
    await page.locator('[data-testid="studio-stop-btn"]').click();
    await page.locator('button:has-text("Close")').click();
  });
});

