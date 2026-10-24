🎯 Đang làm ticket: [BEL-230] (#207) — [TICKET-02] [P0 - FE] Chuẩn hóa 11 vị trí đóng/mở AudioContext, MediaRecorder, SpeechRecognition không dùng catch {} mù | Role: FE | Cột: Testing

- **Ticket:** `#207` (`[BEL-230]`, Kanban Item ID: `PVTI_lAHOAeXQP84BoMSnzhDLjKQ`).
- **Branch:** `feature/BEL-230-fe-webrtc-audio-lifecycle`.
- **Changes Delivered (`NTA-S004`):**
  1. [x] `audio-visualizer-meter.tsx`, `use-audio-meter.ts`, `studio-preview.ts`: checked `state !== "closed"` before `.close()`, removed `.catch(() => {})` and empty `catch (e) {}`.
  2. [x] `use-webrtc-studio.ts`: handled `video.play()` promise via `safePlayVideo`, checked `MediaRecorder.isTypeSupported(options.mimeType)`, and checked `mediaRecorderRef.current.state !== "inactive"` before `.stop()`.
  3. [x] `use-teleprompter.ts`: guarded `recognizer.start()` and `.stop()` with `isRecognitionActiveRef.current` instead of empty `catch (e) {}`.
- **Verification:** `bun test` (12/12 pass), `bun x tsc --noEmit` (0 errors), `trust-benchmark.py` (100%, 0 violations).
