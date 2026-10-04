"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { uploadChunkedVideo, ChunkUploadProgress } from "@/services/media-upload.service";
import { createStudioPreviewStream } from "@/lib/studio-preview";
import {
  Resolution,
  AspectRatio,
  getResolutionConfig,
  getAspectRatioClass,
  getOptimalRecorderOptions,
} from "@/lib/studio-config";
import { acquireStream, enumerateMediaDevices } from "@/lib/studio-stream";
import { useTeleprompter } from "./use-teleprompter";
import { useAudioMeter } from "./use-audio-meter";

export { getResolutionConfig, getAspectRatioClass };
export type { Resolution, AspectRatio };

export function useWebRTCStudio(
  isOpen: boolean,
  candidateName: string,
  username: string,
  onUploadSuccess?: (videoUrl: string, posterUrl?: string) => void
) {
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasAnimationRef = useRef({ current: true });

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isUploadingChunks, setIsUploadingChunks] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<ChunkUploadProgress | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState("");
  const [selectedResolution, setSelectedResolution] = useState<Resolution>("720p");
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>("16:9");

  const audioMeterLevel = useAudioMeter(mediaStream, isOpen);
  const prompter = useTeleprompter(isRecording);

  const refreshDeviceList = useCallback(async () => {
    const { videoInputs, audioInputs } = await enumerateMediaDevices();
    setVideoDevices(videoInputs);
    setAudioDevices(audioInputs);
    if (videoInputs.length > 0 && !selectedDeviceId) setSelectedDeviceId(videoInputs[0].deviceId);
    if (audioInputs.length > 0 && !selectedAudioDeviceId) setSelectedAudioDeviceId(audioInputs[0].deviceId);
  }, [selectedDeviceId, selectedAudioDeviceId]);

  const attachWebcamRef = useCallback(
    (node: HTMLVideoElement | null) => {
      webcamVideoRef.current = node;
      if (node && mediaStream && node.srcObject !== mediaStream) {
        node.srcObject = mediaStream;
        node.play().catch(() => {});
      }
    },
    [mediaStream]
  );

  useEffect(() => {
    if (webcamVideoRef.current && mediaStream && !recordedVideoUrl) {
      if (webcamVideoRef.current.srcObject !== mediaStream) {
        webcamVideoRef.current.srcObject = mediaStream;
      }
      webcamVideoRef.current.play().catch(() => {});
    }
  }, [mediaStream, recordedVideoUrl, isOpen]);

  const handleDeviceChange = async (id: string) => {
    setSelectedDeviceId(id);
    if (isRecordingRef.current) return;
    if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
    const stream = (await acquireStream(id, selectedResolution, selectedRatio, selectedAudioDeviceId)) ||
      createStudioPreviewStream(candidateName, getResolutionConfig(selectedResolution, selectedRatio).width, getResolutionConfig(selectedResolution, selectedRatio).height, selectedRatio, canvasAnimationRef.current);
    setMediaStream(stream);
  };

  const handleAudioDeviceChange = async (id: string) => {
    setSelectedAudioDeviceId(id);
    if (isRecordingRef.current) return;
    if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
    const stream = (await acquireStream(selectedDeviceId, selectedResolution, selectedRatio, id)) ||
      createStudioPreviewStream(candidateName, getResolutionConfig(selectedResolution, selectedRatio).width, getResolutionConfig(selectedResolution, selectedRatio).height, selectedRatio, canvasAnimationRef.current);
    setMediaStream(stream);
  };

  const handleResolutionChange = async (res: Resolution) => {
    setSelectedResolution(res);
    if (isRecordingRef.current) return;
    if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
    const cfg = getResolutionConfig(res, selectedRatio);
    const stream = (await acquireStream(selectedDeviceId, res, selectedRatio, selectedAudioDeviceId)) ||
      createStudioPreviewStream(candidateName, cfg.width, cfg.height, selectedRatio, canvasAnimationRef.current);
    setMediaStream(stream);
  };

  const handleRatioChange = async (ratio: AspectRatio) => {
    setSelectedRatio(ratio);
    if (isRecordingRef.current) return;
    if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
    const cfg = getResolutionConfig(selectedResolution, ratio);
    const stream = (await acquireStream(selectedDeviceId, selectedResolution, ratio, selectedAudioDeviceId)) ||
      createStudioPreviewStream(candidateName, cfg.width, cfg.height, ratio, canvasAnimationRef.current);
    setMediaStream(stream);
  };

  const startStudio = useCallback(async () => {
    setIsRecording(false);
    setRecordingSeconds(0);
    setRecordedBlob(null);
    setRecordedVideoUrl(null);
    setChunkProgress(null);
    recordedChunksRef.current = [];
    prompter.resetPrompter();
    refreshDeviceList();
    const cfg = getResolutionConfig(selectedResolution, selectedRatio);
    canvasAnimationRef.current.current = true;
    const synth = createStudioPreviewStream(candidateName, cfg.width, cfg.height, selectedRatio, canvasAnimationRef.current);
    setMediaStream(synth);
    try {
      const real = await acquireStream(selectedDeviceId, selectedResolution, selectedRatio, selectedAudioDeviceId);
      if (real && !isRecordingRef.current) {
        synth.getTracks().forEach((t) => t.stop());
        setMediaStream(real);
        refreshDeviceList();
      }
    } catch (e) {}
  }, [candidateName, selectedResolution, selectedRatio, selectedDeviceId, selectedAudioDeviceId, refreshDeviceList, prompter]);

  const startRecording = useCallback(() => {
    let stream = mediaStream;
    if (!stream) {
      const cfg = getResolutionConfig(selectedResolution, selectedRatio);
      stream = createStudioPreviewStream(candidateName, cfg.width, cfg.height, selectedRatio, canvasAnimationRef.current);
      setMediaStream(stream);
    }
    recordedChunksRef.current = [];
    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordingSeconds(0);
    prompter.resetPrompter();

    const options = getOptimalRecorderOptions(selectedResolution, selectedRatio);
    try {
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        isRecordingRef.current = false;
        setIsRecording(false);
        const b = new Blob(recordedChunksRef.current.length > 0 ? recordedChunksRef.current : [new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])], {
          type: options.mimeType || "video/webm",
        });
        setRecordedBlob(b);
        setRecordedVideoUrl(URL.createObjectURL(b));
      };
      recorder.start(1000);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 299) {
            stopRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      console.warn("Fallback MediaRecorder:", e);
    }
  }, [mediaStream, selectedResolution, selectedRatio, candidateName, prompter]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setTimeout(() => {
      setRecordedBlob((curr) => {
        if (!curr) {
          const fb = new Blob(recordedChunksRef.current.length > 0 ? recordedChunksRef.current : [new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])], {
            type: "video/webm",
          });
          setRecordedVideoUrl(URL.createObjectURL(fb));
          return fb;
        }
        return curr;
      });
    }, 50);
  }, []);

  const closeStudio = useCallback(() => {
    isRecordingRef.current = false;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    canvasAnimationRef.current.current = false;
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
    setIsRecording(false);
    setRecordedBlob(null);
    setRecordedVideoUrl(null);
    setChunkProgress(null);
  }, [mediaStream]);

  const retake = useCallback(() => {
    setRecordedBlob(null);
    setRecordedVideoUrl(null);
  }, []);

  const uploadPitch = useCallback(async () => {
    if (!recordedBlob) return;
    setIsUploadingChunks(true);
    try {
      const res = await uploadChunkedVideo(recordedBlob, username, (p) => setChunkProgress(p));
      onUploadSuccess?.(res.video_url, res.poster_url);
      alert("Video elevator pitch successfully uploaded via streaming chunks and published with auto-generated thumbnail!");
      closeStudio();
    } catch (err) {
      console.error("Chunked video upload error", err);
      alert("Error uploading video chunks. Please check connection.");
    } finally {
      setIsUploadingChunks(false);
    }
  }, [recordedBlob, username, onUploadSuccess, closeStudio]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return {
    mediaStream,
    webcamVideoRef,
    attachWebcamRef,
    videoDevices,
    selectedDeviceId,
    handleDeviceChange,
    audioDevices,
    selectedAudioDeviceId,
    handleAudioDeviceChange,
    selectedResolution,
    handleResolutionChange,
    selectedRatio,
    handleRatioChange,
    isRecording,
    recordingSeconds,
    recordedBlob,
    recordedVideoUrl,
    isUploadingChunks,
    chunkProgress,
    audioMeterLevel,
    prompter,
    startStudio,
    closeStudio,
    startRecording,
    stopRecording,
    retake,
    uploadPitch,
    formatTimer,
  };
}
