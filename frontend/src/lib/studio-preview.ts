/**
 * Synthetic dynamic studio feed for WebRTC canvas preview when camera is denied/unavailable
 */
export function createStudioPreviewStream(
  name: string,
  width = 1280,
  height = 720,
  ratio: "16:9" | "9:16" | "1:1" | "4:3" = "16:9",
  onStopRef?: { current: boolean }
): MediaStream {
  if (typeof document === "undefined") {
    return null as unknown as MediaStream;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }

  let frame = 0;
  let lastDrawTime = 0;
  const fpsInterval = 1000 / 30; // 30 FPS target throttling

  const draw = (now: number) => {
    if ((onStopRef && !onStopRef.current) || !ctx) return;
    requestAnimationFrame(draw);

    const elapsed = now - lastDrawTime;
    if (elapsed < fpsInterval) return;
    lastDrawTime = now - (elapsed % fpsInterval);

    frame++;

    const cx = width / 2;
    const cy = height / 2;

    // Studio background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#070b12");
    grad.addColorStop(0.5, "#0f172a");
    grad.addColorStop(1, "#070b12");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Studio spotlight glow
    const spotGrad = ctx.createRadialGradient(cx, cy * 0.85, 20, cx, cy * 0.85, Math.min(width, height) * 0.6);
    spotGrad.addColorStop(0, "rgba(91, 187, 174, 0.35)");
    spotGrad.addColorStop(0.5, "rgba(91, 187, 174, 0.08)");
    spotGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid texture
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    const gridSize = Math.max(30, Math.round(width / 32));
    for (let gx = 0; gx < width; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    // Head silhouette
    const headRadius = Math.min(width, height) * 0.13;
    const headY = cy - headRadius * 0.75;

    ctx.beginPath();
    ctx.arc(cx, headY, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#5bbbae";
    ctx.stroke();

    // Shoulders silhouette
    const shoulderW = headRadius * 2.3;
    const shoulderH = headRadius * 1.4;
    const shoulderY = headY + headRadius * 1.95;

    ctx.beginPath();
    ctx.ellipse(cx, shoulderY, shoulderW, shoulderH, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#5bbbae";
    ctx.stroke();

    // Candidate initials
    ctx.fillStyle = "#5bbbae";
    ctx.font = `bold ${Math.round(headRadius * 0.55)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initials = name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "CV";
    ctx.fillText(initials, cx, headY);

    // Waveform at bottom
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#5bbbae";
    ctx.beginPath();
    const waveStartX = Math.max(30, cx - width * 0.28);
    const waveEndX = Math.min(width - 30, cx + width * 0.28);
    const waveY = height * 0.86;
    for (let x = waveStartX; x <= waveEndX; x += 12) {
      const wave = Math.sin((x + frame * 6) * 0.05) * (headRadius * 0.3) * Math.cos(frame * 0.04);
      ctx.moveTo(x, waveY - Math.abs(wave));
      ctx.lineTo(x, waveY + Math.abs(wave));
    }
    ctx.stroke();

    // Status badge top-left
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.beginPath();
    ctx.roundRect(24, 24, 280, 40, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(91, 187, 174, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(42, 44, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 13px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`STUDIO PRO HQ (${ratio})`, 56, 49);

    // Subtitle
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = `600 ${Math.max(13, Math.round(width * 0.02))}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`${name} • 0:30 Pitch`, cx, height * 0.77);
  };

  requestAnimationFrame(draw);
  const stream = canvas.captureStream(30);
  (stream as any).isSynthetic = true;

  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0; // Pure silence
    osc.connect(gain);
    const dst = audioCtx.createMediaStreamDestination();
    gain.connect(dst);
    osc.start();
    const track = dst.stream.getAudioTracks()[0];
    if (track) {
      (track as any).isSynthetic = true;
      stream.addTrack(track);
    }
  } catch (e) {
    // AudioContext optional
  }

  return stream;
}
