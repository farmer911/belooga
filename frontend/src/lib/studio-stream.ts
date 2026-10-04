import { Resolution, AspectRatio, getResolutionConfig } from "./studio-config";

export async function enumerateMediaDevices() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return { videoInputs: [], audioInputs: [] };
  }
  const devs = await navigator.mediaDevices.enumerateDevices();
  const videoInputs = devs.filter((d) => d.kind === "videoinput");
  const audioInputs = devs.filter((d) => d.kind === "audioinput");
  return { videoInputs, audioInputs };
}

export async function acquireStream(
  deviceId?: string,
  res: Resolution = "720p",
  ratio: AspectRatio = "16:9",
  audioDeviceId?: string
): Promise<MediaStream | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }
  const cfg = getResolutionConfig(res, ratio);
  const vConstraints: MediaTrackConstraints = {
    width: { ideal: cfg.width, min: Math.min(cfg.width, 640) },
    height: { ideal: cfg.height, min: Math.min(cfg.height, 480) },
    frameRate: { ideal: 30, min: 24, max: 60 },
    aspectRatio: { ideal: cfg.width / cfg.height },
  };
  if (deviceId) vConstraints.deviceId = { exact: deviceId };
  else vConstraints.facingMode = "user";

  const aConstraints: MediaTrackConstraints = {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    sampleRate: { ideal: 48000 },
  };
  if (audioDeviceId) aConstraints.deviceId = { exact: audioDeviceId };

  try {
    const p = navigator.mediaDevices
      .getUserMedia({ video: vConstraints, audio: aConstraints })
      .catch(() =>
        navigator.mediaDevices.getUserMedia({
          video: vConstraints,
          audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        })
      )
      .catch(() => navigator.mediaDevices.getUserMedia({ video: vConstraints, audio: false }));
    const to = new Promise<null>((r) => setTimeout(() => r(null), 1500));
    return await Promise.race([p, to]);
  } catch (e) {
    console.warn("Could not acquire media stream:", e);
    return null;
  }
}
