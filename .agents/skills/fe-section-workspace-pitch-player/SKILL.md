---
name: fe-section-workspace-pitch-player
description: Specialized Section Skill for the 30-Second Elevator Pitch Video Player and Preview Modal. Covers video playback, autoplay fallback rules, progress bars, and modal controls.
---

# 🎬 Section Skill: 30-Second Pitch Video Player

> **Component Path:** `frontend/src/components/organisms/workspace/video-pitch-section.tsx`  
> **Master Skill:** `fe-page-workspace`  
> **Backend Domain:** Domain 4 (Media & Uploads)  

---

## 1. Scope Boundary

This section maintains responsibility for:
1. Candidate profile pitch preview card (poster image, 30s badge, and hover play icon).
2. Video modal trigger: "Watch Elevator Pitch" or "Record New Pitch".
3. Custom video dialog player with seekable progress bar, elapsed timer, and mute/unmute toggles.
4. Browser Autoplay policy negotiation: Attempt unmuted playback first; automatically fall back to muted autoplay if restricted by browser security policies.

❌ **Explicit Non-Responsibilities:** Does NOT record new webcam footage (handled exclusively by `studio`).

---

## 2. Browser Autoplay Fallback Protocol

Modern browsers (Chrome, Safari, Firefox) restrict unmuted autoplay without prior user gestures. The video modal must follow this robust playback sequence:

```typescript
const handleVideoLoaded = (videoEl: HTMLVideoElement) => {
  // 1. Attempt unmuted playback first
  videoEl.muted = false;
  videoEl.play()
    .then(() => {
      setIsPlaying(true);
      setIsMuted(false);
    })
    .catch(() => {
      // 2. If blocked by browser policy, fallback seamlessly to muted playback
      videoEl.muted = true;
      videoEl.play().then(() => {
        setIsPlaying(true);
        setIsMuted(true);
      });
    });
};
```

---

## 3. QC Anti-Regression Selectors (Mandatory Preservation)

Playwright E2E tests target these exact selectors:
* `[data-testid="pitch-thumbnail-card"]`: Card container displaying the video poster.
* `[data-testid="play-pitch-modal-btn"]`: Interactive button/trigger opening the video modal.
* `[data-testid="pitch-video-modal"]`: Dialog modal container.
* `[data-testid="modal-video-player"]`: HTML5 `<video>` element streaming the WebM/MP4 media.
* `[data-testid="video-mute-toggle"]`: Mute/unmute audio button.
* `[data-testid="close-pitch-modal-btn"]`: Dismiss button closing the modal.

⚠️ **WARNING:** Never modify the CSS class `.video-play-icon` geometry. Modifying this caused past regressions (`VIOLATION-004`) distorting the button into an oversized black ellipse.
