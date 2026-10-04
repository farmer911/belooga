"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface UseVideoPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  togglePlay: () => void;
  toggleMute: (e?: React.MouseEvent) => void;
  replay: (e?: React.MouseEvent) => void;
  pause: () => void;
  seek: (time: number) => void;
  onLoadedData: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onDurationChange: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onEnded: () => void;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useVideoPlayer(initialDuration = 30): UseVideoPlayerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);

  const onLoadedData = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget || videoRef.current;
    if (!v) return;
    if (isFinite(v.duration) && v.duration > 0) {
      setDuration(v.duration);
    }
    // Attempt unmuted play first
    v.muted = false;
    v.play()
      .then(() => {
        setIsPlaying(true);
        setIsMuted(false);
      })
      .catch(() => {
        // Fallback to muted autoplay
        v.muted = true;
        setIsMuted(true);
        v.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      });
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Playback error:", err));
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    const nextMuted = !v.muted;
    v.muted = nextMuted;
    setIsMuted(nextMuted);
  }, []);

  const replay = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play()
      .then(() => setIsPlaying(true))
      .catch((err) => console.warn("Replay error:", err));
  }, []);

  const pause = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setIsPlaying(false);
  }, []);

  const seek = useCallback((time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = time;
    setCurrentTime(time);
  }, []);

  const onPlay = useCallback(() => setIsPlaying(true), []);
  const onPause = useCallback(() => setIsPlaying(false), []);
  const onTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  }, []);
  const onDurationChange = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const dur = e.currentTarget.duration;
    if (isFinite(dur) && dur > 0) {
      setDuration(dur);
    }
  }, []);
  const onEnded = useCallback(() => setIsPlaying(false), []);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  return {
    videoRef,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    togglePlay,
    toggleMute,
    replay,
    pause,
    seek,
    onLoadedData,
    onPlay,
    onPause,
    onTimeUpdate,
    onDurationChange,
    onEnded,
    setIsMuted,
  };
}
