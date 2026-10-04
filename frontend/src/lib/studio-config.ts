export type Resolution = "1080p" | "720p" | "480p";
export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3";

export function getResolutionConfig(res: Resolution, ratio: AspectRatio) {
  let baseW = 1280;
  let baseH = 720;
  let videoBitrate = 3_500_000;
  let label = "3.5 Mbps HD";

  if (res === "1080p") {
    baseW = 1920;
    baseH = 1080;
    videoBitrate = 6_000_000;
    label = "6.0 Mbps Full HD";
  } else if (res === "480p") {
    baseW = 854;
    baseH = 480;
    videoBitrate = 1_800_000;
    label = "1.8 Mbps SD";
  }

  switch (ratio) {
    case "16:9":
      return { width: baseW, height: baseH, videoBitrate, audioBitrate: 128_000, label };
    case "9:16":
      return { width: baseH, height: baseW, videoBitrate, audioBitrate: 128_000, label };
    case "1:1":
      return { width: baseH, height: baseH, videoBitrate, audioBitrate: 128_000, label };
    case "4:3":
      return { width: Math.round((baseH * 4) / 3), height: baseH, videoBitrate, audioBitrate: 128_000, label };
    default:
      return { width: baseW, height: baseH, videoBitrate, audioBitrate: 128_000, label };
  }
}

export function getAspectRatioClass(ratio: AspectRatio): string {
  switch (ratio) {
    case "16:9":
      return "aspect-video max-w-2xl w-full";
    case "9:16":
      return "aspect-[9/16] max-w-xs w-full max-h-[480px]";
    case "1:1":
      return "aspect-square max-w-sm w-full max-h-[440px]";
    case "4:3":
      return "aspect-[4/3] max-w-lg w-full max-h-[440px]";
    default:
      return "aspect-video max-w-2xl w-full";
  }
}

export function getOptimalRecorderOptions(res: Resolution, ratio: AspectRatio): MediaRecorderOptions {
  const config = getResolutionConfig(res, ratio);
  const codecs = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm",
  ];
  let chosenMime = "";
  if (typeof MediaRecorder !== "undefined") {
    for (const mime of codecs) {
      if (MediaRecorder.isTypeSupported(mime)) {
        chosenMime = mime;
        break;
      }
    }
  }
  return {
    ...(chosenMime ? { mimeType: chosenMime } : {}),
    videoBitsPerSecond: config.videoBitrate,
    audioBitsPerSecond: config.audioBitrate,
  };
}
