# Section Reference: Video Pitch Card & Player Modal

- **Components:** `frontend/src/components/features/media/video-pitch-card.tsx`, `frontend/src/components/features/media/video-pitch-modal.tsx`
- **Hook:** `frontend/src/hooks/use-video-player.ts`
- **Master Skill:** `fe-page-workspace`
- **Backend Domain:** Domain 4 (Media & Uploads)

---

## 1. Scope Boundary
This section maintains responsibility for:
1. Elevator pitch thumbnail card and video status display (ready, processing, empty).
2. Video playback modal popup with custom media controls (play/pause, progress scrubber, mute, fullscreen).
3. Handling fallback poster images and duration labels.

---

## 2. API Contracts & Media Streams
- **Video Stream:** Static/streamed from `/v1/media/video/{filename}` or signed CDN URL.
- **Video Status:** `GET /v1/media/video-status/{username}`

---

## 3. QC Anti-Regression Selectors
Playwright E2E and visual tests target these selectors:
- `[data-testid="video-pitch-card"]`: Outer pitch video card container.
- `[data-testid="play-pitch-btn"]`: Thumbnail play trigger button.
- `[data-testid="video-modal"]`: Dialog container for the video player.
- `[data-testid="video-player"]`: Underlying `<video>` HTML5 element.
- `[data-testid="video-play-btn"]`: Modal video play button.
- `[data-testid="video-pause-btn"]`: Modal video pause button.
- `[data-testid="close-video-modal-btn"]`: Modal dismissal button.
