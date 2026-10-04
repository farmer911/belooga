"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_SCRIPT =
  "Hello, I am a passionate Senior Software Engineer with deep expertise in full-stack architecture, high-performance distributed systems, and modern UI engineering.\n\nOver the past 6 years, I have spearheaded the architecture of resilient cloud-native platforms, designed scalable microservices handling millions of daily transactions, and crafted buttery-smooth user interfaces.\n\nI thrive in fast-paced environments where code quality, clean architecture, and rapid execution matter. Excited to connect and build impactful products together!";

export function useTeleprompter(isRecording: boolean) {
  const [teleprompterEnabled, setTeleprompterEnabled] = useState(true);
  const [isPrompterCollapsed, setIsPrompterCollapsed] = useState(false);
  const [scriptText, setScriptText] = useState<string>(DEFAULT_SCRIPT);
  const [scriptWords, setScriptWords] = useState<string[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(130);
  const [teleprompterFontSize, setTeleprompterFontSize] = useState<"sm" | "md" | "lg">("md");
  const [isEditingScript, setIsEditingScript] = useState<boolean>(false);

  // Voice state
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [hasVoiceStarted, setHasVoiceStarted] = useState<boolean>(false);
  const lastVoiceDetectedTimeRef = useRef<number>(0);

  const scriptFileInputRef = useRef<HTMLInputElement>(null);
  const teleprompterContainerRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Parse words
  useEffect(() => {
    const words = scriptText.trim().split(/\s+/).filter(Boolean);
    setScriptWords(words);
    setActiveWordIndex(0);
  }, [scriptText]);

  // Import script file
  const handleImportScriptFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setScriptText(content.trim());
        setActiveWordIndex(0);
        setTeleprompterEnabled(true);
        setIsEditingScript(false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  // Web Speech API: Voice recognition following
  useEffect(() => {
    if (isRecording && teleprompterEnabled && typeof window !== "undefined") {
      if (typeof navigator !== "undefined" && navigator.webdriver) {
        return;
      }
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        try {
          const recognizer = new SpeechRecognitionClass();
          recognizer.continuous = true;
          recognizer.interimResults = true;
          recognizer.lang = navigator.language || "en-US";

          recognizer.onresult = (event: any) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript + " ";
            }
            const spoken = transcript.toLowerCase().trim().split(/\s+/).filter(Boolean);
            const lastSpoken = spoken[spoken.length - 1];

            if (!lastSpoken || lastSpoken.replace(/[^a-z0-9]/g, "").length < 2) return;

            lastVoiceDetectedTimeRef.current = Date.now();
            setIsVoiceActive(true);
            setHasVoiceStarted(true);

            if (scriptWords.length > 0) {
              const cleanSpoken = lastSpoken.replace(/[^a-z0-9]/g, "");
              if (cleanSpoken.length >= 2) {
                for (let offset = 0; offset <= 15; offset++) {
                  const checkIdx = activeWordIndex + offset;
                  if (checkIdx < scriptWords.length) {
                    const cleanScript = scriptWords[checkIdx].toLowerCase().replace(/[^a-z0-9]/g, "");
                    if (cleanScript && (cleanScript.includes(cleanSpoken) || cleanSpoken.includes(cleanScript))) {
                      setActiveWordIndex(checkIdx);
                      break;
                    }
                  }
                }
              }
            }
          };

          recognizer.onerror = () => {};
          recognizer.onend = () => {
            if (isRecording && teleprompterEnabled && speechRecognitionRef.current) {
              try {
                recognizer.start();
              } catch (e) {}
            }
          };

          recognizer.start();
          speechRecognitionRef.current = recognizer;
        } catch (e) {
          console.warn("Speech recognition error:", e);
        }
      }
    } else {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
        speechRecognitionRef.current = null;
      }
    }

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isRecording, teleprompterEnabled, scriptWords, activeWordIndex]);

  // Voice-gated auto-highlight & auto-scroll
  useEffect(() => {
    if (!isRecording || !teleprompterEnabled || scriptWords.length === 0) return;

    const msPerWord = Math.max(120, Math.round((60 / teleprompterSpeed) * 1000));
    const interval = setInterval(() => {
      const now = Date.now();
      const isSpeaking =
        lastVoiceDetectedTimeRef.current > 0 && now - lastVoiceDetectedTimeRef.current <= 1300;

      if (!isSpeaking) return;

      setActiveWordIndex((prev) => {
        if (prev < scriptWords.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, msPerWord);

    return () => clearInterval(interval);
  }, [isRecording, teleprompterEnabled, teleprompterSpeed, scriptWords.length]);

  // Smooth scroll
  useEffect(() => {
    if (activeWordIndex >= 0 && teleprompterContainerRef.current) {
      const activeEl = teleprompterContainerRef.current.querySelector(
        `[data-word-idx="${activeWordIndex}"]`
      ) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }
  }, [activeWordIndex]);

  const simulateVoice = useCallback(() => {
    setHasVoiceStarted(true);
    setIsVoiceActive(true);
    lastVoiceDetectedTimeRef.current = Date.now();
  }, []);

  const resetPrompter = useCallback(() => {
    setActiveWordIndex(0);
    setHasVoiceStarted(false);
    lastVoiceDetectedTimeRef.current = 0;
    setIsVoiceActive(false);
  }, []);

  return {
    teleprompterEnabled,
    setTeleprompterEnabled,
    isPrompterCollapsed,
    setIsPrompterCollapsed,
    scriptText,
    setScriptText,
    scriptWords,
    activeWordIndex,
    setActiveWordIndex,
    teleprompterSpeed,
    setTeleprompterSpeed,
    teleprompterFontSize,
    setTeleprompterFontSize,
    isEditingScript,
    setIsEditingScript,
    isVoiceActive,
    hasVoiceStarted,
    lastVoiceDetectedTimeRef,
    scriptFileInputRef,
    teleprompterContainerRef,
    handleImportScriptFile,
    simulateVoice,
    resetPrompter,
  };
}
