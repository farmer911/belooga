# Section Reference: WebRTC Recording Studio & Teleprompter

- **Components:** `frontend/src/components/features/studio/webrtc-studio-modal.tsx`, `studio-viewfinder.tsx`, `studio-toolbar.tsx`, `teleprompter-overlay.tsx`, `teleprompter-editor-dialog.tsx`
- **Hooks:** `frontend/src/hooks/use-webrtc-studio.ts`, `use-audio-meter.ts`, `use-teleprompter.ts`
- **Master Skill:** `fe-page-workspace`
- **Backend Domain:** Domain 4 (Media & Uploads)

---

## 1. Scope Boundary
This section maintains responsibility for:
1. WebRTC camera and microphone permission request and device selection.
2. Live viewfinder preview with canvas-based audio volume meter (60fps requestAnimationFrame).
3. Teleprompter script overlay with adjustable scroll speed, font size, and editor modal.
4. MediaRecorder recording lifecycle (countdown -> record -> stop) and chunked video upload reassembly.
5. Resource cleanup: Stopping all `MediaStreamTrack`s and closing `AudioContext` on modal dismissal.

---

## 2. API Contracts & Chunked Uploads
- **Upload Chunk:** `POST /v1/media/upload/chunk/` (`multipart/form-data`)
- **Complete Upload:** `POST /v1/media/upload/complete/` (`{ "filename": "...", "total_chunks": N }`)

---

## 3. QC Anti-Regression Selectors
- `[data-testid="studio-modal"]`: Dialog containing the WebRTC recording studio.
- `[data-testid="open-studio-btn"]`: Trigger button opening the studio modal.
- `[data-testid="record-toggle-btn"]`: Start/stop recording button.
- `[data-testid="studio-viewfinder"]`: Camera stream preview element.
- `[data-testid="teleprompter-overlay"]`: Scrolling teleprompter text container.
