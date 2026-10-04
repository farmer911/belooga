"use client";

import { useState, useRef, useEffect } from "react";

export function useAudioMeter(mediaStream: MediaStream | null, isActive: boolean) {
  const [audioMeterLevel, setAudioMeterLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnimFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    if (isActive && typeof window !== "undefined") {
      try {
        const AudioClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioClass) {
          const ctx = new AudioClass();
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.4;
          const tracks = mediaStream?.getAudioTracks() || [];
          if (tracks.length > 0 && !(mediaStream as any)?.isSynthetic) {
            try {
              const src = ctx.createMediaStreamSource(mediaStream!);
              src.connect(analyser);
            } catch (err) {}
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
            ctx.close().catch(() => {});
          };
        }
      } catch (e) {}
    } else {
      setAudioMeterLevel(0);
    }
  }, [mediaStream, isActive]);

  return audioMeterLevel;
}
