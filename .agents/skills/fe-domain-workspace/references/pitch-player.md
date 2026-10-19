# Section Reference: Video Pitch Card & Player Modal

- **Components:** `frontend/src/components/features/media/video-pitch-card.tsx`, `frontend/src/components/features/media/video-pitch-modal.tsx`
- **Hook:** `frontend/src/hooks/use-video-player.ts`
- **Master Skill:** `fe-domain-workspace`
- **Backend Domain:** Domain 4 (Media & Uploads)

---

## 1. Scope Boundary
This section maintains responsibility for:
1. Elevator pitch thumbnail card and video status display (ready, processing, empty).
2. Video playback modal popup with custom media controls (play/pause, progress scrubber, mute, fullscreen).
3. Handling fallback poster images and duration labels.

---

## 2. API Contracts & Media Streams
- **Video Stream:** Static/streamed from `/uploads/videos/{filename}` or signed CDN URL.
- **Video Status:** `GET /v1/profile/{username}/video-status/`

---

## 3. QC Anti-Regression Selectors
Playwright E2E and visual tests target these selectors:
- `[data-testid="record-pitch-studio-btn"]`: Trigger button to open WebRTC studio.
- `[data-testid="play-pitch-modal-btn"]`: Thumbnail play trigger button.
- `[data-testid="candidate-poster-img"]`: Poster thumbnail image.
- `[data-testid="pitch-video-modal"]`: Dialog container for the video player.
- `[data-testid="modal-video-player"]`: Underlying `<video>` HTML5 element.
- `[data-testid="video-mute-toggle"]`: Modal audio mute toggle button.
- `[data-testid="close-pitch-modal-btn"]`: Modal dismissal button.
