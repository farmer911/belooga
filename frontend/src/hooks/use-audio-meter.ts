"use client";

import { useState, useRef, useEffect } from "react";

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

interface SyntheticMediaStream extends MediaStream {
  isSynthetic?: boolean;
}

export function useAudioMeter(mediaStream: MediaStream | null, isActive: boolean) {
  const [audioMeterLevel, setAudioMeterLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnimFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    if (isActive && typeof window !== "undefined") {
      try {
        const AudioClass = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
        if (AudioClass) {
          const ctx = new AudioClass();
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.4;
          const tracks = mediaStream?.getAudioTracks() || [];
          if (tracks.length > 0 && !(mediaStream as SyntheticMediaStream | null)?.isSynthetic && ctx.state !== "closed") {
            try {
              const src = ctx.createMediaStreamSource(mediaStream!);
              src.connect(analyser);
            } catch (err: unknown) {
              console.warn("AudioMeter stream source notice:", err);
              setAudioMeterLevel(0);
            }
          }
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const loop = () => {
            if (!active) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setAudioMeterLevel(Math.min(100, Math.round((avg / 128) * 100)));
            audioAnimFrameRef.current = requestAnimationFrame(loop);
          };
          audioAnimFrameRef.current = requestAnimationFrame(loop);
          return () => {
            active = false;
            if (audioAnimFrameRef.current) cancelAnimationFrame(audioAnimFrameRef.current);
            if (ctx.state !== "closed") {
              void ctx.close();
            }
          };
        }
      } catch (err: unknown) {
        console.warn("AudioMeter initialization notice:", err);
        setAudioMeterLevel(0);
      }
    } else {
      setAudioMeterLevel(0);
    }
  }, [mediaStream, isActive]);

  return audioMeterLevel;
}
