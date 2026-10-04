---
name: fe-section-workspace-studio
description: Specialized Section Skill for the WebRTC Video Recording Studio. Covers MediaRecorder, camera/mic selection, 60fps VU meter re-render isolation, Voice Activity Detection (VAD), speech-following Teleprompter, and chunked video uploads.
---

# 🎙️ Section Skill: WebRTC Video Studio & Recording Engine

> **Component Path:** `frontend/src/components/organisms/workspace/video-studio-section.tsx`  
> **Master Skill:** `fe-page-workspace`  
> **Backend Domain:** Domain 4 (Media & Uploads) & Domain 5 (Video Studio)  

---

## 1. Scope Boundary

This section encompasses the integrated in-browser recording suite, consisting of five core subsystems:
1. **WebRTC Hardware Control:** Device enumeration (`navigator.mediaDevices.enumerateDevices`), mic/camera selectors, resolution controls (720p/1080p), and aspect ratio toggles (16:9 landscape vs 9:16 portrait).
2. **Audio Telemetry & Real-Time VU Meter (60Hz):** Real-time volume amplitude measurement via Web Audio API (`AudioContext`, `AnalyserNode`).
3. **Voice Activity Detection (VAD):** Heuristic speech energy thresholding to determine when the user is speaking.
4. **Speech-Following Teleprompter:** Script reader with Web Speech API integration (`webkitSpeechRecognition`), karaoke-style word highlighting, and auto-scrolling **strictly gated on detected voice**.
5. **MediaRecorder & Chunked Upload:** 30-second bounded recording, binary blob slicing, and sequential multi-chunk upload to the backend API.

---

## 2. 60fps Re-render Isolation Technique (Leaf-Node Architecture)

### 🔴 Legacy Architectural Defect:
Previously, the real-time audio amplitude (`audioLevel`) was committed to the parent workspace component's `useState`. Updating state 60 times per second caused the **entire 3,000-line DOM tree to continuously re-render**, degrading browser frame rates.

### 🟢 Production Isolation Standard:
Isolate the VU meter into an independent leaf component (`<AudioVUMeter />`) rendered directly via HTML5 `<canvas>` and `requestAnimationFrame`:

```typescript
// src/components/molecules/vu-meter.tsx
export function AudioVUMeter({ analyserNode }: { analyserNode: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    let animId: number;

    const renderFrame = () => {
      animId = requestAnimationFrame(renderFrame);
      analyserNode.getByteFrequencyData(dataArray);
      // Render audio telemetry bars directly on canvas...
    };
    renderFrame();

    return () => cancelAnimationFrame(animId);
  }, [analyserNode]);

  return <canvas ref={canvasRef} width={120} height={12} className="rounded" />;
}
```
👉 **Outcome:** 60fps telemetry visualization with **zero parent re-renders**.

---

## 3. Chunked Upload Sequence

Upon recording completion:
1. `MediaRecorder.stop()` generates the final video `Blob` (`video/webm;codecs=vp8,opus`).
2. Generate upload transaction ID: `upload_id = "rec_" + Date.now()`.
3. Slice the Blob into 1MB chunks (`1024 * 1024` bytes).
4. Sequentially transmit each chunk: `POST /v1/profile/{username}/video-pitch/chunk/` (`upload_id`, `chunk_index`, binary file).
5. Transmit the completion signal:
   `POST /v1/profile/{username}/video-pitch/complete/`
   ```json
   {
     "upload_id": "rec_1712345678",
     "total_chunks": 4,
     "username": "alexnguyen",
     "filename": "pitch.webm"
   }
   ```
6. Backend merges chunks on disk/S3 and returns the persistent `video_pitch_url`.
7. Client invalidates the cache: `queryClient.invalidateQueries({ queryKey: ['candidate-profile', username] })`.

---

## 4. QC Anti-Regression Selectors (Mandatory Preservation)

Playwright E2E tests target these exact studio selectors:
* `[data-testid="open-studio-btn"]`: Studio dialog opener button.
* `[data-testid="studio-modal"]`: WebRTC studio dialog overlay.
* `[data-testid="camera-preview-video"]`: Video element displaying active camera stream.
* `[data-testid="record-start-btn"]`: Button initiating video capture.
* `[data-testid="record-stop-btn"]`: Button completing capture.
* `[data-testid="teleprompter-textarea"]`: Textarea accepting speech script.
* `[data-testid="vu-meter-bar"]`: Audio telemetry level indicator.
