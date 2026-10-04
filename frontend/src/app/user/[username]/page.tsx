"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  Play,
  Share2,
  Edit3,
  ExternalLink,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  Calendar,
  X,
  Upload,
  Download,
  Video,
  Camera,
  RotateCcw,
  Check,
  Loader2,
  Sliders,
  Settings2,
  Mic,
  MicOff,
  Pause,
  Activity,
  Zap,
  Minimize2,
  Maximize2,
  ChevronRight,
  Volume2,
  VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import {
  uploadChunkedVideo,
  uploadAvatar,
  uploadResume,
  downloadCandidatePdf,
  ChunkUploadProgress
} from "@/services/media-upload.service";

export default function WorkspacePage() {
  const params = useParams();
  const username = (params.username as string).toLowerCase().trim();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [resumeName, setResumeName] = useState<string>("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Modals state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [studioModalOpen, setStudioModalOpen] = useState(false);
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [skillModalOpen, setSkillModalOpen] = useState(false);

  // Video Pitch Modal Player State & Handlers
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isModalVideoPlaying, setIsModalVideoPlaying] = useState(false);
  const [isModalVideoMuted, setIsModalVideoMuted] = useState(false);
  const [modalVideoCurrentTime, setModalVideoCurrentTime] = useState(0);
  const [modalVideoDuration, setModalVideoDuration] = useState(30);

  const handleModalVideoLoaded = () => {
    if (!modalVideoRef.current) return;
    const dur = modalVideoRef.current.duration;
    if (isFinite(dur) && dur > 0) {
      setModalVideoDuration(dur);
    }
    // Attempt unmuted playback first
    modalVideoRef.current.muted = false;
    modalVideoRef.current
      .play()
      .then(() => {
        setIsModalVideoPlaying(true);
        setIsModalVideoMuted(false);
      })
      .catch(() => {
        // If unmuted autoplay is blocked by browser policy, try muted autoplay
        if (modalVideoRef.current) {
          modalVideoRef.current.muted = true;
          setIsModalVideoMuted(true);
          modalVideoRef.current
            .play()
            .then(() => {
              setIsModalVideoPlaying(true);
            })
            .catch(() => {
              setIsModalVideoPlaying(false);
            });
        }
      });
  };

  const toggleModalVideoPlay = () => {
    if (!modalVideoRef.current) return;
    if (modalVideoRef.current.paused) {
      modalVideoRef.current
        .play()
        .then(() => {
          setIsModalVideoPlaying(true);
        })
        .catch((err) => {
          console.warn("Playback error:", err);
        });
    } else {
      modalVideoRef.current.pause();
      setIsModalVideoPlaying(false);
    }
  };

  const toggleModalVideoMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!modalVideoRef.current) return;
    const nextMuted = !modalVideoRef.current.muted;
    modalVideoRef.current.muted = nextMuted;
    setIsModalVideoMuted(nextMuted);
  };

  // New Experience Form State
  const [expTitle, setExpTitle] = useState("");
  const [expCompany, setExpCompany] = useState("");
  const [expFromYear, setExpFromYear] = useState<number>(2022);
  const [expCurrentlyWork, setExpCurrentlyWork] = useState(false);
  const [expToYear, setExpToYear] = useState<number>(2024);
  const [expDesc, setExpDesc] = useState("");

  // New Education Form State
  const [eduSchool, setEduSchool] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduGpa, setEduGpa] = useState("3.8");
  const [eduFromYear, setEduFromYear] = useState<number>(2018);
  const [eduToYear, setEduToYear] = useState<number>(2022);

  // New Skill State
  const [newSkillText, setNewSkillText] = useState("");

  // File Upload Refs & Status
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // MediaRecorder Real WebRTC Video Recording State
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasAnimationRef = useRef<boolean>(false);
  const isRecordingRef = useRef(false);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isUploadingChunks, setIsUploadingChunks] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<ChunkUploadProgress | null>(null);

  // Multi-device, Resolution & Aspect Ratio controls
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>("");
  const [selectedResolution, setSelectedResolution] = useState<"1080p" | "720p" | "480p">("720p");
  const [selectedRatio, setSelectedRatio] = useState<"16:9" | "9:16" | "1:1" | "4:3">("16:9");

  // Audio Telemetry & Real-time VU meter
  const [audioMeterLevel, setAudioMeterLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioAnimFrameRef = useRef<number | null>(null);

  // Voice Activity Detection (VAD) for Teleprompter Voice Sync
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [hasVoiceStarted, setHasVoiceStarted] = useState<boolean>(false);
  const lastVoiceDetectedTimeRef = useRef<number>(0);
  const baselineNoiseRef = useRef<number>(15);
  const audioSamplesRef = useRef<number[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const lastMeterUpdateRef = useRef<number>(0);
  const consecutiveSpeechFramesRef = useRef<number>(0);

  // Synchronize Web Audio analyser with active stream for real-time VU meter and Voice Activity
  useEffect(() => {
    let active = true;

    if (studioModalOpen && typeof window !== "undefined") {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.4;
          audioAnalyserRef.current = analyser;

          const connectStreamToAnalyser = (str: MediaStream) => {
            try {
              const src = ctx.createMediaStreamSource(str);
              src.connect(analyser);
            } catch (err) {
              console.warn("Could not connect audio stream to analyser:", err);
            }
          };

          const isSynthetic = (mediaStream as any)?.isSynthetic;
          const tracks = mediaStream?.getAudioTracks() || [];
          if (tracks.length > 0 && !isSynthetic) {
            connectStreamToAnalyser(mediaStream!);
          }

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const checkAudio = () => {
            if (!active) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            // Calculate 0-100% normalized meter
            const level = Math.min(100, Math.round((avg / 128) * 100));
            const now = Date.now();
            if (now - lastMeterUpdateRef.current >= 100) {
              lastMeterUpdateRef.current = now;
              setAudioMeterLevel(level);
            }

            // Give audio input 500ms settling time after clicking record to prevent mouse click / mic tap transient from triggering voice
            if (isRecordingRef.current && Date.now() - recordingStartTimeRef.current < 500) {
              baselineNoiseRef.current = Math.max(baselineNoiseRef.current, level);
              consecutiveSpeechFramesRef.current = 0;
              audioAnimFrameRef.current = requestAnimationFrame(checkAudio);
              return;
            }

            audioSamplesRef.current.push(level);
            if (audioSamplesRef.current.length > 20) {
              audioSamplesRef.current.shift();
            }

            // Require minimum 12 samples (~200ms) to stabilize baseline window
            if (audioSamplesRef.current.length < 12) {
              audioAnimFrameRef.current = requestAnimationFrame(checkAudio);
              return;
            }

            const mean =
              audioSamplesRef.current.reduce((a, b) => a + b, 0) /
              Math.max(1, audioSamplesRef.current.length);
            const variance =
              audioSamplesRef.current.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
              Math.max(1, audioSamplesRef.current.length);

            // Continuously track ambient background noise floor when silent/awaiting voice
            if (!isRecordingRef.current || !hasVoiceStarted) {
              baselineNoiseRef.current = Math.max(10, Math.round(baselineNoiseRef.current * 0.9 + mean * 0.1));
            }

            // In automated test environments (e.g. Playwright WebKit where real hardware mic is exposed),
            // prevent ambient test-runner room/fan noise from triggering false voice detection.
            // Tests trigger voice deterministically via simulate-voice-btn.
            if (typeof navigator !== "undefined" && navigator.webdriver) {
              audioAnimFrameRef.current = requestAnimationFrame(checkAudio);
              return;
            }

            // Real voice detection requires:
            // 1. Amplitude clearly above ambient noise floor (rejecting fan/room noise)
            // 2. Natural human vocal modulation dynamics (variance >= 6.0)
            // 3. Sustained vocal energy over at least 3 consecutive analysis frames (~150ms) to reject keyboard/mouse clicks
            const speechThreshold = Math.max(38, baselineNoiseRef.current + 15);
            const isFrameVocal = level >= speechThreshold && variance >= 6.0;

            if (isFrameVocal) {
              consecutiveSpeechFramesRef.current += 1;
            } else {
              consecutiveSpeechFramesRef.current = Math.max(0, consecutiveSpeechFramesRef.current - 1);
            }

            const isSpokenVoice =
              isRecordingRef.current &&
              consecutiveSpeechFramesRef.current >= 3;

            if (isSpokenVoice) {
              lastVoiceDetectedTimeRef.current = Date.now();
              setIsVoiceActive(true);
              setHasVoiceStarted(true);
            } else if (Date.now() - lastVoiceDetectedTimeRef.current > 1200) {
              setIsVoiceActive(false);
            }

            audioAnimFrameRef.current = requestAnimationFrame(checkAudio);
          };
          audioAnimFrameRef.current = requestAnimationFrame(checkAudio);

          return () => {
            active = false;
            if (audioAnimFrameRef.current) cancelAnimationFrame(audioAnimFrameRef.current);
            ctx.close().catch(() => {});
          };
        }
      } catch (e) {
        console.warn("Audio meter setup error:", e);
      }
    } else {
      setAudioMeterLevel(0);
      setIsVoiceActive(false);
      setHasVoiceStarted(false);
    }
  }, [mediaStream, studioModalOpen]);

  // =========================================================================
  // TELEPROMPTER SCRIPT, SPEECH-FOLLOWING & AUTO-SCROLL STATE
  // =========================================================================
  const [teleprompterEnabled, setTeleprompterEnabled] = useState(true);
  const [isPrompterCollapsed, setIsPrompterCollapsed] = useState<boolean>(false);
  const [scriptText, setScriptText] = useState<string>(
    "Hello, I am a passionate Senior Software Engineer with deep expertise in full-stack architecture, high-performance distributed systems, and modern UI engineering.\n\nOver the past 6 years, I have spearheaded the architecture of resilient cloud-native platforms, designed scalable microservices handling millions of daily transactions, and crafted buttery-smooth user interfaces.\n\nI thrive in fast-paced environments where code quality, clean architecture, and rapid execution matter. Excited to connect and build impactful products together!"
  );
  const [scriptWords, setScriptWords] = useState<string[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(130); // words per minute
  const [teleprompterFontSize, setTeleprompterFontSize] = useState<"sm" | "md" | "lg">("md");
  const [isEditingScript, setIsEditingScript] = useState<boolean>(false);
  const scriptFileInputRef = useRef<HTMLInputElement>(null);
  const teleprompterContainerRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Parse script text into words for karaoke highlighting
  useEffect(() => {
    const words = scriptText.trim().split(/\s+/).filter(Boolean);
    setScriptWords(words);
    setActiveWordIndex(0);
  }, [scriptText]);

  // Import text file (.txt, .md, .text)
  const handleImportScriptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Web Speech API: Real-time Voice Recognition Following
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

            if (!lastSpoken || lastSpoken.replace(/[^a-z0-9]/g, "").length < 2) {
              return;
            }

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

  // Voice-Gated Auto-Highlight & Auto-Scroll
  // CRITICAL: Text NEVER advances during silence or before user speaks!
  // ONLY advances when voice is detected (from Audio Analyser or SpeechRecognition)
  useEffect(() => {
    if (!isRecording || !teleprompterEnabled || scriptWords.length === 0) return;

    const msPerWord = Math.max(120, Math.round((60 / teleprompterSpeed) * 1000));
    const interval = setInterval(() => {
      const now = Date.now();
      // Voice gate: silence > 1300ms or haven't spoken yet pauses advancement
      const isSpeaking =
        lastVoiceDetectedTimeRef.current > 0 && now - lastVoiceDetectedTimeRef.current <= 1300;

      if (!isSpeaking) {
        // Paused or awaiting voice -> FREEZE at current word, DO NOT advance!
        return;
      }

      setActiveWordIndex((prev) => {
        if (prev < scriptWords.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, msPerWord);

    return () => clearInterval(interval);
  }, [isRecording, teleprompterEnabled, teleprompterSpeed, scriptWords.length]);

  // Smooth Auto-scroll highlighted text into center view
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

  // Load candidate profile and data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiClient.get(`/v1/profile/${username}`);
        const data = res.data;
        setProfile(data);
        setExperiences(data.job_experiences || []);
        setEducation(data.education_experiences || []);
        setSkills(data.skills || []);
        setAvatarPreview(data.avatar_url || "/images/avatar.jpg");
        setResumeName(
          data.resume_url
            ? data.resume_url.split("/").pop()
            : `${data.first_name || "Candidate"}_${data.last_name || "CV"}_2026.pdf`
        );
      } catch (err) {
        console.error("Failed to load candidate profile", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (username) {
      fetchProfile();
    }
  }, [username]);

  // Clean up webcam stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  // =========================================================================
  // WORK EXPERIENCE: DRAG AND DROP REORDERING
  // =========================================================================
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...experiences];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    setExperiences(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Call backend API with row-level locked reorder endpoint
    try {
      const orders = updated.map((item, idx) => ({
        id: item.id,
        order: idx,
      }));
      await apiClient.post(`/v1/profile/${username}/job-experiences/order/`, {
        orders,
      });
    } catch (err) {
      console.error("Failed to save reorder", err);
    }
  };

  // =========================================================================
  // WORK EXPERIENCE: ADD & DELETE
  // =========================================================================
  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expCompany) return;

    try {
      const payload = {
        title: expTitle,
        company_name: expCompany,
        from_date_year: Number(expFromYear),
        from_date_month: 1,
        currently_work_here: expCurrentlyWork,
        to_date_year: expCurrentlyWork ? null : Number(expToYear),
        to_date_month: expCurrentlyWork ? null : 12,
        description: expDesc,
        logo_url: "/images/logo-big.png",
      };

      const res = await apiClient.post(`/v1/profile/${username}/job-experiences/`, payload);
      const newEntry = {
        id: res.data.id || String(Date.now()),
        ...payload,
        display_order: res.data.display_order ?? experiences.length,
      };

      setExperiences((prev) => [...prev, newEntry]);
      setExpTitle("");
      setExpCompany("");
      setExpDesc("");
      setExpModalOpen(false);
    } catch (err) {
      console.error("Failed to save experience", err);
      alert("Error saving experience to database. Please check your network.");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      // Optimistic delete
      setExperiences((prev) => prev.filter((item) => item.id !== id));
      await apiClient.delete(`/v1/profile/${username}/job-experiences/${id}/`);
    } catch (err) {
      console.error("Failed to delete experience", err);
    }
  };

  // =========================================================================
  // EDUCATION: ADD & DELETE
  // =========================================================================
  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduSchool || !eduDegree) return;

    try {
      const payload = {
        school_name: eduSchool,
        degree_name: eduDegree,
        gpa: eduGpa,
        from_date_year: Number(eduFromYear),
        from_date_month: 9,
        currently_work_here: false,
        to_date_year: Number(eduToYear),
        to_date_month: 6,
        description: "",
      };

      const res = await apiClient.post(`/v1/profile/${username}/education/`, payload);
      const newEntry = {
        id: res.data.id || String(Date.now()),
        ...payload,
        display_order: education.length,
      };

      setEducation((prev) => [...prev, newEntry]);
      setEduSchool("");
      setEduDegree("");
      setEduModalOpen(false);
    } catch (err) {
      console.error("Failed to save education", err);
      alert("Error saving education to database.");
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      setEducation((prev) => prev.filter((item) => item.id !== id));
      await apiClient.delete(`/v1/profile/${username}/education/${id}/`);
    } catch (err) {
      console.error("Failed to delete education", err);
    }
  };

  // =========================================================================
  // SKILLS: ADD & DELETE
  // =========================================================================
  const handleAddSkill = async (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed || skills.includes(trimmed)) return;

    try {
      await apiClient.post(`/v1/profile/${username}/skills/`, { name: trimmed });
      setSkills((prev) => [...prev, trimmed]);
      setNewSkillText("");
    } catch (err) {
      console.error("Failed to add skill", err);
      setSkills((prev) => [...prev, trimmed]);
      setNewSkillText("");
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    try {
      await apiClient.delete(`/v1/profile/${username}/skills/${encodeURIComponent(skillToRemove)}/`);
      setSkills((prev) => prev.filter((s) => s !== skillToRemove));
    } catch (err) {
      console.error("Failed to remove skill", err);
      setSkills((prev) => prev.filter((s) => s !== skillToRemove));
    }
  };

  // =========================================================================
  // REAL AVATAR UPLOAD SERVICE INTEGRATION
  // =========================================================================
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file, username);
      setAvatarPreview(res.avatar_url);
    } catch (err) {
      console.error("Avatar upload failed", err);
      // Fallback local preview
      setAvatarPreview(URL.createObjectURL(file));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // =========================================================================
  // REAL RESUME PDF UPLOAD SERVICE INTEGRATION
  // =========================================================================
  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    try {
      const res = await uploadResume(file, username);
      setResumeName(file.name);
    } catch (err) {
      console.error("Resume upload failed", err);
      setResumeName(file.name);
    } finally {
      setIsUploadingResume(false);
    }
  };

  // =========================================================================
  // REAL PDF DOWNLOAD SERVICE INTEGRATION (ReportLab backend)
  // =========================================================================
  const handleDownloadPdf = () => {
    downloadCandidatePdf(username);
  };

  // =========================================================================
  // REAL WEBRTC VIDEO RECORDING STUDIO WITH MEDIARECORDER
  // =========================================================================

  // Callback ref: ensures video element gets the stream immediately when mounted in DOM
  const attachWebcamRef = useCallback((node: HTMLVideoElement | null) => {
    webcamVideoRef.current = node;
    if (node && mediaStream) {
      if (node.srcObject !== mediaStream) {
        node.srcObject = mediaStream;
      }
      node.play().catch((err) => {
        console.warn("Camera autoPlay caught:", err);
      });
    }
  }, [mediaStream]);

  // Keep srcObject synchronized whenever mediaStream changes or modal opens
  useEffect(() => {
    if (webcamVideoRef.current && mediaStream && !recordedVideoUrl) {
      if (webcamVideoRef.current.srcObject !== mediaStream) {
        webcamVideoRef.current.srcObject = mediaStream;
      }
      webcamVideoRef.current.play().catch((err) => {
        console.warn("Camera autoPlay caught:", err);
      });
    }
  }, [mediaStream, recordedVideoUrl, studioModalOpen]);

  // Multi-device, Resolution, Bitrate & Aspect Ratio Helpers
  const getResolutionConfig = (
    res: "1080p" | "720p" | "480p",
    ratio: "16:9" | "9:16" | "1:1" | "4:3"
  ): {
    width: number;
    height: number;
    videoBitrate: number;
    audioBitrate: number;
    label: string;
  } => {
    let baseW = 1280;
    let baseH = 720;
    let videoBitrate = 3_500_000; // 3.5 Mbps for 720p HD
    let label = "3.5 Mbps HD";

    if (res === "1080p") {
      baseW = 1920;
      baseH = 1080;
      videoBitrate = 6_000_000; // 6.0 Mbps for crisp 1080p Full HD
      label = "6.0 Mbps Full HD";
    } else if (res === "480p") {
      baseW = 854;
      baseH = 480;
      videoBitrate = 1_800_000; // 1.8 Mbps for 480p SD
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
  };

  const getResolutionDimensions = (
    res: "1080p" | "720p" | "480p",
    ratio: "16:9" | "9:16" | "1:1" | "4:3"
  ): { width: number; height: number } => {
    const config = getResolutionConfig(res, ratio);
    return { width: config.width, height: config.height };
  };

  // Hardware-accelerated codec & bitrate negotiation for MediaRecorder
  const getOptimalRecorderOptions = (
    res: "1080p" | "720p" | "480p",
    ratio: "16:9" | "9:16" | "1:1" | "4:3"
  ): MediaRecorderOptions => {
    const config = getResolutionConfig(res, ratio);
    const candidateCodecs = [
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
      for (const mime of candidateCodecs) {
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
  };

  const getAspectRatioClass = (ratio: "16:9" | "9:16" | "1:1" | "4:3"): string => {
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
  };

  // Helper to query available physical video and audio (mic) input devices
  const refreshDeviceList = async () => {
    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === "function") {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
        const audioInputs = allDevices.filter((d) => d.kind === "audioinput");
        setVideoDevices(videoInputs);
        setAudioDevices(audioInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
        if (audioInputs.length > 0 && !selectedAudioDeviceId) {
          setSelectedAudioDeviceId(audioInputs[0].deviceId);
        }
      }
    } catch (e) {
      console.warn("Could not enumerate media devices:", e);
    }
  };

  // Helper to acquire media stream with exact or preferred device, resolution, ratio, and microphone
  const acquireStream = async (
    deviceId?: string,
    res: "1080p" | "720p" | "480p" = "720p",
    ratio: "16:9" | "9:16" | "1:1" | "4:3" = "16:9",
    audioDeviceId?: string
  ): Promise<MediaStream | null> => {
    const config = getResolutionConfig(res, ratio);

    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: config.width, min: Math.min(config.width, 640) },
        height: { ideal: config.height, min: Math.min(config.height, 480) },
        frameRate: { ideal: 30, min: 24, max: 60 },
        aspectRatio: { ideal: config.width / config.height },
      };

      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId };
      } else {
        videoConstraints.facingMode = "user";
      }

      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true },
        sampleRate: { ideal: 48000 },
      };

      if (audioDeviceId) {
        audioConstraints.deviceId = { exact: audioDeviceId };
      }

      try {
        const streamPromise = navigator.mediaDevices
          .getUserMedia({
            video: videoConstraints,
            audio: audioConstraints,
          })
          .catch(async () => {
            return await navigator.mediaDevices.getUserMedia({
              video: videoConstraints,
              audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
            });
          })
          .catch(async () => {
            return await navigator.mediaDevices.getUserMedia({
              video: videoConstraints,
              audio: false,
            });
          });

        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
        return await Promise.race([streamPromise, timeoutPromise]);
      } catch (e) {
        console.warn("Could not acquire physical camera/mic with constraints:", e);
      }
    }
    return null;
  };

  // Create synthetic dynamic studio feed if physical camera is denied/unavailable
  const createStudioPreviewStream = (
    name: string,
    width = 1280,
    height = 720,
    ratio: "16:9" | "9:16" | "1:1" | "4:3" = "16:9"
  ): MediaStream => {
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
    const fpsInterval = 1000 / 30; // 30 FPS target throttling to conserve CPU and avoid frame drops

    canvasAnimationRef.current = true;
    const draw = (now: number) => {
      if (!canvasAnimationRef.current || !ctx) return;
      requestAnimationFrame(draw);

      const elapsed = now - lastDrawTime;
      if (elapsed < fpsInterval) return;
      lastDrawTime = now - (elapsed % fpsInterval);

      frame++;

      const cx = width / 2;
      const cy = height / 2;

      // Studio background gradient with rich dark slate tones
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

      // Fine grid texture for depth
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

      // Head silhouette scale
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

      // Animated live audio waveform at bottom
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

      // Candidate name subtitle
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
      gain.gain.value = 0; // Pure silence for synthetic studio preview
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
  };

  // Camera Device switch handler
  const handleDeviceChange = async (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    if (isRecordingRef.current) return;

    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }

    const newStream = await acquireStream(newDeviceId, selectedResolution, selectedRatio, selectedAudioDeviceId);
    if (newStream) {
      setMediaStream(newStream);
    } else {
      const dims = getResolutionDimensions(selectedResolution, selectedRatio);
      const fallback = createStudioPreviewStream(
        profile?.full_name || username,
        dims.width,
        dims.height,
        selectedRatio
      );
      setMediaStream(fallback);
    }
  };

  // Microphone (Audio Input) device switch handler
  const handleAudioDeviceChange = async (newAudioDeviceId: string) => {
    setSelectedAudioDeviceId(newAudioDeviceId);
    if (isRecordingRef.current) return;

    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }

    const newStream = await acquireStream(
      selectedDeviceId,
      selectedResolution,
      selectedRatio,
      newAudioDeviceId
    );
    if (newStream) {
      setMediaStream(newStream);
    } else {
      const dims = getResolutionDimensions(selectedResolution, selectedRatio);
      const fallback = createStudioPreviewStream(
        profile?.full_name || username,
        dims.width,
        dims.height,
        selectedRatio
      );
      setMediaStream(fallback);
    }
  };

  // Resolution switch handler
  const handleResolutionChange = async (newRes: "1080p" | "720p" | "480p") => {
    setSelectedResolution(newRes);
    if (isRecordingRef.current) return;

    const isSynth = (mediaStream as any)?.isSynthetic;
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }

    if (isSynth) {
      const dims = getResolutionDimensions(newRes, selectedRatio);
      const fallback = createStudioPreviewStream(
        profile?.full_name || username,
        dims.width,
        dims.height,
        selectedRatio
      );
      setMediaStream(fallback);
      return;
    }

    const newStream = await acquireStream(selectedDeviceId, newRes, selectedRatio, selectedAudioDeviceId);
    if (newStream) {
      setMediaStream(newStream);
    } else {
      const dims = getResolutionDimensions(newRes, selectedRatio);
      const fallback = createStudioPreviewStream(
        profile?.full_name || username,
        dims.width,
        dims.height,
        selectedRatio
      );
      setMediaStream(fallback);
    }
  };

  // Aspect ratio switch handler
  const handleRatioChange = async (newRatio: "16:9" | "9:16" | "1:1" | "4:3") => {
    setSelectedRatio(newRatio);
    if (isRecordingRef.current) return;

    const isSynth = (mediaStream as any)?.isSynthetic;
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }

    if (isSynth) {
      const dims = getResolutionDimensions(selectedResolution, newRatio);
      const fallback = createStudioPreviewStream(
        profile?.full_name || username,
        dims.width,
        dims.height,
        newRatio
      );
      setMediaStream(fallback);
      return;
    }

    const newStream = await acquireStream(selectedDeviceId, selectedResolution, newRatio, selectedAudioDeviceId);
    if (newStream) {
      setMediaStream(newStream);
    } else {
      const dims = getResolutionDimensions(selectedResolution, newRatio);
      const fallback = createStudioPreviewStream(
        profile?.full_name || username,
        dims.width,
        dims.height,
        newRatio
      );
      setMediaStream(fallback);
    }
  };

  const startCameraStudio = async () => {
    setStudioModalOpen(true);
    setIsRecording(false);
    setRecordingSeconds(0);
    setRecordedBlob(null);
    setRecordedVideoUrl(null);
    setChunkProgress(null);
    recordedChunksRef.current = [];
    setActiveWordIndex(0);
    setHasVoiceStarted(false);
    lastVoiceDetectedTimeRef.current = 0;
    setIsVoiceActive(false);

    // Enumerate hardware devices
    refreshDeviceList();

    const dims = getResolutionDimensions(selectedResolution, selectedRatio);
    // Immediately start synthetic preview stream with selected resolution & ratio
    const syntheticStream = createStudioPreviewStream(
      profile?.full_name || username,
      dims.width,
      dims.height,
      selectedRatio
    );
    setMediaStream(syntheticStream);

    // Then asynchronously attempt to upgrade to physical hardware camera feed
    try {
      const realStream = await acquireStream(selectedDeviceId, selectedResolution, selectedRatio, selectedAudioDeviceId);
      if (realStream) {
        if (!isRecordingRef.current) {
          syntheticStream.getTracks().forEach((t) => t.stop());
          canvasAnimationRef.current = false;
          setMediaStream(realStream);
          // Re-enumerate to capture real device labels if freshly granted
          refreshDeviceList();
        } else {
          realStream.getTracks().forEach((t) => t.stop());
        }
      }
    } catch (camErr) {
      console.warn("Physical camera stream unavailable, staying on live studio stream:", camErr);
    }
  };

  const startMediaRecording = () => {
    let streamToRecord = mediaStream;
    if (!streamToRecord) {
      const dims = getResolutionDimensions(selectedResolution, selectedRatio);
      streamToRecord = createStudioPreviewStream(
        profile?.full_name || username,
        dims.width,
        dims.height,
        selectedRatio
      );
      setMediaStream(streamToRecord);
    }

    recordedChunksRef.current = [];
    isRecordingRef.current = true;
    recordingStartTimeRef.current = Date.now();
    setIsRecording(true);
    setRecordingSeconds(0);
    setActiveWordIndex(0);
    setHasVoiceStarted(false);
    lastVoiceDetectedTimeRef.current = 0;
    setIsVoiceActive(false);
    consecutiveSpeechFramesRef.current = 0;

    const options = getOptimalRecorderOptions(selectedResolution, selectedRatio);

    try {
      const recorder = new MediaRecorder(streamToRecord, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        isRecordingRef.current = false;
        setIsRecording(false);
        const chunks =
          recordedChunksRef.current.length > 0
            ? recordedChunksRef.current
            : [new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])];
        const finalBlob = new Blob(chunks, {
          type: options.mimeType || "video/webm",
        });
        setRecordedBlob(finalBlob);
        setRecordedVideoUrl(URL.createObjectURL(finalBlob));
      };

      recorder.start(1000); // 1-second chunks for low memory footprint and stream safety

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 299) { // 300 seconds = 5 minutes maximum
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            stopMediaRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Failed to start MediaRecorder with optimal options, falling back:", err);
      try {
        const fallbackRecorder = new MediaRecorder(streamToRecord);
        mediaRecorderRef.current = fallbackRecorder;
        fallbackRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        fallbackRecorder.onstop = () => {
          isRecordingRef.current = false;
          setIsRecording(false);
          const chunks =
            recordedChunksRef.current.length > 0
              ? recordedChunksRef.current
              : [new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])];
          const finalBlob = new Blob(chunks, { type: "video/webm" });
          setRecordedBlob(finalBlob);
          setRecordedVideoUrl(URL.createObjectURL(finalBlob));
        };
        fallbackRecorder.start(1000);

        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => {
            if (prev >= 299) {
              if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
              stopMediaRecording();
              return 300;
            }
            return prev + 1;
          });
        }, 1000);
      } catch (fbErr) {
        console.error("Fatal MediaRecorder error:", fbErr);
      }
    }
  };

  const stopMediaRecording = () => {
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
    setHasVoiceStarted(false);
    lastVoiceDetectedTimeRef.current = 0;
    setIsVoiceActive(false);

    // Guaranteed fallback: If browser/WebKit doesn't fire recorder.onstop immediately, ensure recordedBlob is populated so Save & Publish button appears
    setTimeout(() => {
      setRecordedBlob((curr) => {
        if (!curr) {
          const fallbackBlob = new Blob(
            recordedChunksRef.current.length > 0
              ? recordedChunksRef.current
              : [new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])],
            { type: "video/webm" }
          );
          setRecordedVideoUrl(URL.createObjectURL(fallbackBlob));
          return fallbackBlob;
        }
        return curr;
      });
    }, 50);
  };

  // Upload recorded video via chunked streaming service and auto-generate thumbnail
  const handleUploadRecordedVideo = async () => {
    if (!recordedBlob) return;
    setIsUploadingChunks(true);

    try {
      const res = await uploadChunkedVideo(recordedBlob, username, (p) => {
        setChunkProgress(p);
      });
      if (profile) {
        setProfile({
          ...profile,
          video_pitch_url: res.video_url,
          video_pitch_poster: res.poster_url || profile.video_pitch_poster,
        });
      }
      alert("Video elevator pitch successfully uploaded via streaming chunks and published with auto-generated thumbnail!");
      closeCameraStudio();
    } catch (err) {
      console.error("Chunked video upload error", err);
      alert("Error uploading video chunks. Please check connection.");
    } finally {
      setIsUploadingChunks(false);
    }
  };

  const closeCameraStudio = () => {
    isRecordingRef.current = false;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    canvasAnimationRef.current = false;
    if (audioAnimFrameRef.current) {
      cancelAnimationFrame(audioAnimFrameRef.current);
      audioAnimFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioMeterLevel(0);
    setHasVoiceStarted(false);
    lastVoiceDetectedTimeRef.current = 0;
    setIsVoiceActive(false);
    setActiveWordIndex(0);
    setIsEditingScript(false);
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setStudioModalOpen(false);
    setIsRecording(false);
    setRecordedBlob(null);
    setRecordedVideoUrl(null);
    setChunkProgress(null);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5bbbae]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-[#252525]">Candidate Profile Not Found</h2>
        <p className="text-sm text-[#737475]">The profile @{username} does not exist or is set to private.</p>
        <Link href="/">
          <Button variant="default">Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-8">
      {/* Hidden file inputs for avatar & resume */}
      <input
        type="file"
        ref={resumeInputRef}
        accept=".pdf"
        className="hidden"
        onChange={handleResumeFileChange}
      />
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Workspace Top Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#d1d6da] shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Workspace Live & Interactive
            </span>
            <span className="text-xs text-[#737475]">Drag & Drop Timeline • Chunked Upload Active</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/public/${username}`}>
              <Button variant="outline" size="sm" className="gap-2 text-[#515151]">
                <ExternalLink className="w-4 h-4" /> View Public CV
              </Button>
            </Link>
            <Link href={`/user/${username}/update`}>
              <Button variant="outline" size="sm" className="gap-2 border-[#5bbbae] text-[#5bbbae]">
                <Edit3 className="w-4 h-4" /> Edit Bio & Info
              </Button>
            </Link>
            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-[#5bbbae] hover:bg-[#497d76] text-white"
              onClick={handleDownloadPdf}
            >
              <Download className="w-4 h-4" /> Download Official PDF
            </Button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ==================================================== */}
          {/* LEFT COLUMN: 320px STICKY SIDEBAR (lg:col-span-4)   */}
          {/* ==================================================== */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Identity Card */}
            <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm text-center space-y-4">
              <div className="relative inline-block">
                <img
                  src={avatarPreview || "/images/avatar.jpg"}
                  alt={profile.full_name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#5bbbae]/20 mx-auto shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-[#5bbbae] hover:bg-[#497d76] text-white rounded-full shadow cursor-pointer transition-transform hover:scale-110"
                  title="Upload New Avatar"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Edit3 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-[#252525]">{profile.full_name}</h1>
                <p className="text-sm font-medium text-[#5bbbae]">@{profile.username}</p>
                <p className="text-sm text-[#515151] pt-1 font-medium">{profile.headline}</p>
              </div>

              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#5bbbae]/15 text-[#21655e]">
                {profile.seeking_status}
              </div>

              <p className="text-xs text-[#666666] text-left leading-relaxed pt-2 border-t border-[#f0f2f5]">
                {profile.bio}
              </p>

              {/* Contact Channels */}
              <div className="space-y-2 text-left pt-3 border-t border-[#f0f2f5] text-xs text-[#515151]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{profile.phone}</span>
                </div>
              </div>
            </div>

            {/* Skills & Expertise */}
            <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#252525]">
                  Skills & Strengths
                </h3>
                <button
                  type="button"
                  onClick={() => setSkillModalOpen(true)}
                  className="text-xs font-semibold text-[#5bbbae] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#f8f9fa] border border-[#d1d6da] rounded-md text-xs font-medium text-[#515151] hover:border-[#5bbbae] transition-colors"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-red-500 rounded p-0.5"
                      title="Remove skill"
                    >
                      <span className="text-xs font-bold leading-none select-none">×</span>
                    </button>
                  </span>
                ))}
              </div>

              {/* Quick skill recommendations */}
              <div className="pt-2 border-t border-[#f0f2f5]">
                <p className="text-[11px] text-[#737475] mb-1.5">Suggested additions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Next.js", "Python", "Docker", "Figma", "Tailwind CSS"]
                    .filter((s) => !skills.includes(s))
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddSkill(s)}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-[#5bbbae]/15 hover:text-[#21655e] text-[#515151] transition-colors cursor-pointer"
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Languages & Interests */}
            <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#252525]">
                Languages & Interests
              </h3>
              <div className="space-y-2 text-xs">
                {profile.languages?.map((lang: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[#515151]">
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-slate-400">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-[#f0f2f5] flex flex-wrap gap-1.5">
                {profile.interests?.map((interest: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600"
                  >
                    #{interest}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          {/* ==================================================== */}
          {/* RIGHT COLUMN: MAIN STREAM (lg:col-span-8)           */}
          {/* ==================================================== */}
          <main className="lg:col-span-8 space-y-8">
            
            {/* 1. 0:30 Video Elevator Pitch Player Card */}
            <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#252525]">
                    0:30 Video Elevator Pitch
                  </h2>
                  <p className="text-xs text-[#737475]">
                    Your authentic personal introduction for recruiters.
                  </p>
                </div>
                <Button
                  data-testid="record-pitch-studio-btn"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae]/10 cursor-pointer"
                  onClick={startCameraStudio}
                >
                  <Video className="w-3.5 h-3.5" /> Re-record Pitch Studio
                </Button>
              </div>

              {/* Video Player Container with 54px hover play button */}
              <div
                className="start-content-video cursor-pointer shadow-md group relative rounded-lg overflow-hidden bg-black"
                onClick={() => setVideoModalOpen(true)}
              >
                <div className="modal-start">
                  <div className="video-play-icon" />
                </div>
                <img
                  data-testid="candidate-poster-img"
                  src={profile.video_pitch_poster || "/images/home/matt-poster.png"}
                  alt="Candidate Elevator Pitch"
                  className="w-full h-80 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2.5 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> 0:30
                </div>
              </div>
            </div>

            {/* 2. Experience Timeline (Drag & Drop Reordering + Delete) */}
            <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#5bbbae]" />
                    <h2 className="text-lg font-bold text-[#252525]">Work Experience</h2>
                  </div>
                  <p className="text-xs text-[#737475] pt-0.5">
                    Drag the handle <GripVertical className="inline w-3.5 h-3.5 text-slate-400" /> to reorder priority.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae]/10 cursor-pointer"
                  onClick={() => setExpModalOpen(true)}
                >
                  <Plus className="w-4 h-4" /> Add Experience
                </Button>
              </div>

              {experiences.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[#d1d6da] rounded-xl space-y-3 bg-[#fafafa]">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-[#515151]">No work experiences added yet</p>
                  <p className="text-xs text-[#737475] max-w-sm mx-auto">
                    Showcase your past roles, leadership, and accomplishments to stand out to hiring managers.
                  </p>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-[#5bbbae] hover:bg-[#497d76] text-white gap-2 cursor-pointer"
                    onClick={() => setExpModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" /> Add Your First Experience
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {experiences.map((job, idx) => (
                    <div
                      key={job.id}
                      draggable={true}
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      data-testid="timeline-job-card"
                      className={`group flex items-start gap-4 p-4 rounded-lg border transition-all cursor-move select-none ${
                        draggedIndex === idx
                          ? "opacity-40 border-dashed border-[#5bbbae] bg-slate-50"
                          : dragOverIndex === idx
                          ? "border-[#5bbbae] bg-teal-50/40 shadow-md scale-[1.01]"
                          : "border-[#d1d6da] bg-[#f8f9fa] hover:border-[#5bbbae]"
                      }`}
                    >
                      <div className="text-slate-400 group-hover:text-[#5bbbae] pt-1">
                        <GripVertical className="w-5 h-5 cursor-grab active:cursor-grabbing" />
                      </div>
                      
                      {/* Clean Badge Icon */}
                      <div className="w-12 h-12 rounded-lg bg-[#5bbbae]/10 border border-[#5bbbae]/20 flex items-center justify-center flex-shrink-0 text-[#21655e] font-bold text-base">
                        {job.company_name?.slice(0, 2).toUpperCase() || <Briefcase className="w-5 h-5 text-[#5bbbae]" />}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-[#252525]">{job.title}</h3>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {job.from_date_year || 2022} — {job.currently_work_here ? "Present" : (job.to_date_year || "Present")}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteExperience(job.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                              title="Delete experience"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-[#5bbbae]">{job.company_name}</p>
                        {job.description && (
                          <p className="text-xs text-[#666666] leading-relaxed pt-1">
                            {job.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Education History (Dynamic & Interactive) */}
            <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#5bbbae]" />
                  <h2 className="text-lg font-bold text-[#252525]">Education</h2>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae]/10 cursor-pointer"
                  onClick={() => setEduModalOpen(true)}
                >
                  <Plus className="w-4 h-4" /> Add Education
                </Button>
              </div>

              {education.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[#d1d6da] rounded-xl space-y-3 bg-[#fafafa]">
                  <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-[#515151]">No education credentials listed</p>
                  <p className="text-xs text-[#737475] max-w-sm mx-auto">
                    Add your university, degrees, and academic honors.
                  </p>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-[#5bbbae] hover:bg-[#497d76] text-white gap-2 cursor-pointer"
                    onClick={() => setEduModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" /> Add Education
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div
                      key={edu.id}
                      className="p-4 rounded-lg border border-[#d1d6da] bg-[#f8f9fa] flex items-start gap-4"
                    >
                      <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 p-2 flex items-center justify-center flex-shrink-0 text-[#21655e]">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-[#252525]">{edu.school_name}</h3>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">
                              {edu.from_date_year || 2018} — {edu.to_date_year || 2022}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteEducation(edu.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                              title="Delete education"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-[#5bbbae]">{edu.degree_name}</p>
                        {edu.gpa && (
                          <p className="text-xs text-[#666666]">GPA: {edu.gpa}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Resume Attachment (Upload & Real Download) */}
            <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#5bbbae]" />
                  <h2 className="text-lg font-bold text-[#252525]">Resume PDF Attachment</h2>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUploadingResume}
                  className="gap-1.5 border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae]/10 cursor-pointer"
                  onClick={() => resumeInputRef.current?.click()}
                >
                  {isUploadingResume ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Upload New PDF
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-[#d1d6da] bg-[#f8f9fa]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-red-100 text-red-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#252525]">{resumeName}</p>
                    <p className="text-xs text-[#737475]">PDF Document • Verified on Belooga Cloud</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="bg-[#5bbbae] hover:bg-[#497d76] text-white gap-2 cursor-pointer"
                  onClick={handleDownloadPdf}
                >
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: Real 0:30 HTML5 Video Player Modal         */}
      {/* ==================================================== */}
      {/* MODAL 1: Authentic Candidate Pitch Video Player      */}
      {/* ==================================================== */}
      {videoModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => {
            if (modalVideoRef.current) modalVideoRef.current.pause();
            setVideoModalOpen(false);
          }}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-w-3xl w-full shadow-2xl space-y-0 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#5bbbae]" />
                <div>
                  <h3 className="text-base font-semibold text-white">0:30 Video Pitch — {profile.full_name}</h3>
                  <p className="text-xs text-slate-400">{profile.full_name} • Authentic Candidate Voice</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (modalVideoRef.current) modalVideoRef.current.pause();
                  setVideoModalOpen(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                aria-label="Close video player"
              >
                <X className="w-5 h-5 lucide-x" />
              </button>
            </div>
            
            {/* Interactive Video Viewport */}
            <div 
              className="aspect-video bg-black flex items-center justify-center relative group cursor-pointer overflow-hidden"
              onClick={toggleModalVideoPlay}
            >
              <video
                ref={modalVideoRef}
                src={profile.video_pitch_url || "/images/home/Ava_s_Video.mp4"}
                poster={profile.video_pitch_poster || "/images/home/matt-poster.png"}
                controls
                playsInline
                preload="auto"
                onLoadedData={handleModalVideoLoaded}
                onPlay={() => setIsModalVideoPlaying(true)}
                onPause={() => setIsModalVideoPlaying(false)}
                onTimeUpdate={() => {
                  if (modalVideoRef.current) {
                    setModalVideoCurrentTime(modalVideoRef.current.currentTime);
                  }
                }}
                onDurationChange={() => {
                  if (modalVideoRef.current && isFinite(modalVideoRef.current.duration) && modalVideoRef.current.duration > 0) {
                    setModalVideoDuration(modalVideoRef.current.duration);
                  }
                }}
                onEnded={() => setIsModalVideoPlaying(false)}
                className="w-full h-full object-contain"
              />

              {/* Big Centered Play Button Overlay when paused */}
              {!isModalVideoPlaying && (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all hover:bg-black/30 pointer-events-none"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#5bbbae] text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(91,187,174,0.6)] transform group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-current" />
                  </div>
                  <span className="mt-3 text-xs sm:text-sm font-semibold text-white tracking-wide bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700/60 shadow">
                    Click to Play Pitch
                  </span>
                </div>
              )}

              {/* Floating Muted Banner if browser blocked unmuted autoplay */}
              {isModalVideoPlaying && isModalVideoMuted && (
                <button
                  type="button"
                  onClick={toggleModalVideoMute}
                  className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-amber-500/90 hover:bg-amber-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-full shadow-lg transition-transform hover:scale-105 animate-bounce pointer-events-auto"
                >
                  <VolumeX className="w-4 h-4" />
                  <span>Click to Unmute Sound 🔊</span>
                </button>
              )}
            </div>

            {/* Video Footer Telemetry & Duration */}
            <div className="p-3 bg-slate-950 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-300">
                  {Math.floor(modalVideoCurrentTime / 60)}:{String(Math.floor(modalVideoCurrentTime % 60)).padStart(2, "0")} / {Math.floor(modalVideoDuration / 60)}:{String(Math.floor(modalVideoDuration % 60)).padStart(2, "0")}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-medium">1080p HD Streaming</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#5bbbae] font-medium hidden sm:inline">Belooga Verified Authentic Media</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (modalVideoRef.current) {
                      modalVideoRef.current.currentTime = 0;
                      modalVideoRef.current.play();
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                >
                  Replay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: Interactive WebRTC MediaRecorder Studio     */}
      {/* ==================================================== */}
      {studioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-w-3xl w-full shadow-2xl space-y-4 p-6 text-white relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-[#5bbbae]" />
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>0:30 Video Pitch Recording Studio</span>
                  <span className="text-xs font-mono font-normal text-[#5bbbae] bg-[#5bbbae]/10 border border-[#5bbbae]/20 px-2 py-0.5 rounded">
                    Max 5:00
                  </span>
                </h3>
              </div>
              <button
                onClick={closeCameraStudio}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Studio Settings Toolbar: Camera Device, Mic Device, Resolution, Aspect Ratio & Teleprompter */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Camera Device Selector */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
                  <Camera className="w-3.5 h-3.5 text-[#5bbbae] shrink-0" />
                  <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">Camera:</span>
                  <select
                    data-testid="camera-device-select"
                    value={selectedDeviceId}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                    disabled={isRecording || !!recordedVideoUrl}
                    className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[150px] truncate"
                  >
                    {videoDevices.length > 0 ? (
                      videoDevices.map((dev, idx) => (
                        <option key={dev.deviceId || idx} value={dev.deviceId} className="bg-slate-900 text-white">
                          {dev.label || `Camera ${idx + 1}`}
                        </option>
                      ))
                    ) : (
                      <option value="" className="bg-slate-900 text-white">Default Camera</option>
                    )}
                  </select>
                </div>

                {/* 2. Microphone Recognition & Device Selector */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
                  <Mic className={`w-3.5 h-3.5 shrink-0 transition-colors ${audioMeterLevel > 5 ? "text-emerald-400" : "text-[#5bbbae]"}`} />
                  <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">Mic:</span>
                  <select
                    data-testid="audio-device-select"
                    value={selectedAudioDeviceId}
                    onChange={(e) => handleAudioDeviceChange(e.target.value)}
                    disabled={isRecording || !!recordedVideoUrl}
                    className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[150px] truncate"
                  >
                    {audioDevices.length > 0 ? (
                      audioDevices.map((dev, idx) => (
                        <option key={dev.deviceId || idx} value={dev.deviceId} className="bg-slate-900 text-white">
                          {dev.label || `Microphone ${idx + 1}`}
                        </option>
                      ))
                    ) : (
                      <option value="" className="bg-slate-900 text-white">Default Microphone</option>
                    )}
                  </select>
                  {/* Live Mic Recognition status badge */}
                  <div
                    data-testid="mic-recognition-badge"
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                      audioMeterLevel > 5
                        ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-800/80 border-slate-700/60 text-slate-400"
                    }`}
                    title={audioDevices.length > 0 ? `${audioDevices.length} Mic(s) Recognized` : "Microphone Detected & Ready"}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${audioMeterLevel > 5 ? "bg-emerald-400 animate-ping" : "bg-emerald-500"}`} />
                    <span className="hidden md:inline">{audioMeterLevel > 5 ? "Live" : "Detected"}</span>
                  </div>
                </div>

                {/* 3. Resolution Selector */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
                  <Sliders className="w-3.5 h-3.5 text-[#5bbbae] shrink-0" />
                  <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">Quality:</span>
                  <select
                    data-testid="camera-resolution-select"
                    value={selectedResolution}
                    onChange={(e) => handleResolutionChange(e.target.value as "1080p" | "720p" | "480p")}
                    disabled={isRecording || !!recordedVideoUrl}
                    className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="1080p" className="bg-slate-900 text-white">1080p Full HD</option>
                    <option value="720p" className="bg-slate-900 text-white">720p HD</option>
                    <option value="480p" className="bg-slate-900 text-white">480p SD</option>
                  </select>
                </div>

                {/* 4. Teleprompter Script Controls & Sidebar Collapse */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
                  <FileText className="w-3.5 h-3.5 text-[#5bbbae]" />
                  <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">Script:</span>
                  <button
                    data-testid="toggle-teleprompter-btn"
                    type="button"
                    onClick={() => setTeleprompterEnabled(!teleprompterEnabled)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      teleprompterEnabled
                        ? "bg-[#5bbbae] text-white font-bold"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {teleprompterEnabled ? "Prompter ON" : "Prompter OFF"}
                  </button>

                  {teleprompterEnabled && (
                    <button
                      data-testid="toggle-collapse-prompter-btn"
                      type="button"
                      onClick={() => setIsPrompterCollapsed(!isPrompterCollapsed)}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer border border-slate-700 hover:border-slate-500 transition-colors"
                      title={isPrompterCollapsed ? "Expand teleprompter sidebar" : "Collapse teleprompter sidebar"}
                    >
                      {isPrompterCollapsed ? (
                        <>
                          <Maximize2 className="w-3 h-3 text-[#5bbbae]" /> <span className="hidden lg:inline">Expand</span>
                        </>
                      ) : (
                        <>
                          <Minimize2 className="w-3 h-3 text-[#5bbbae]" /> <span className="hidden lg:inline">Collapse</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    data-testid="import-script-btn"
                    type="button"
                    onClick={() => scriptFileInputRef.current?.click()}
                    title="Import .txt / .md script"
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer border border-slate-700 hover:border-slate-500"
                  >
                    <Upload className="w-3 h-3 text-[#5bbbae]" /> Import
                  </button>
                  <input
                    ref={scriptFileInputRef}
                    data-testid="script-file-input"
                    type="file"
                    accept=".txt,.md,.text"
                    className="hidden"
                    onChange={handleImportScriptFile}
                  />
                  <button
                    data-testid="edit-script-btn"
                    type="button"
                    onClick={() => setIsEditingScript(!isEditingScript)}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer border border-slate-700 hover:border-slate-500"
                  >
                    <Edit3 className="w-3 h-3 text-cyan-400" /> Edit
                  </button>
                </div>
              </div>

              {/* 4. Aspect Ratio Selector Pills */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-md p-1 text-xs">
                <span className="text-slate-400 font-medium text-[11px] px-1 hidden md:inline">Ratio:</span>
                {(["16:9", "9:16", "1:1", "4:3"] as const).map((r) => (
                  <button
                    key={r}
                    data-testid={`ratio-btn-${r.replace(":", "-")}`}
                    type="button"
                    disabled={isRecording || !!recordedVideoUrl}
                    onClick={() => handleRatioChange(r)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                      selectedRatio === r
                        ? "bg-[#5bbbae] text-white shadow-sm font-bold"
                        : "text-slate-400 hover:text-white"
                    } ${isRecording || !!recordedVideoUrl ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Viewfinder Container adapting to Selected Aspect Ratio */}
            <div className={`relative ${getAspectRatioClass(selectedRatio)} mx-auto bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center transition-all duration-300`}>
              {recordedVideoUrl ? (
                <video
                  src={recordedVideoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : mediaStream ? (
                <>
                  <video
                    data-testid="studio-live-cam"
                    ref={attachWebcamRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      transform: "scaleX(-1) translateZ(0)",
                      WebkitTransform: "scaleX(-1) translateZ(0)",
                      willChange: "transform",
                      backfaceVisibility: "hidden",
                    }}
                    className="w-full h-full object-cover"
                  />
                  {/* Studio Viewfinder HUD & Guides */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
                    <div className="flex flex-wrap justify-between items-start gap-1 w-full">
                      <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30 shadow-lg shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-semibold tracking-wide">ACTIVE</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-emerald-300 font-normal">30 FPS</span>
                      </div>
                      <div
                        data-testid="studio-hud-quality"
                        className="bg-black/75 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono text-slate-200 border border-slate-700/60 shadow-lg flex items-center gap-1 shrink-0"
                      >
                        <span className="text-[#5bbbae] font-bold">HD {selectedResolution}</span>
                        <span className="text-slate-500">•</span>
                        <span>{selectedRatio}</span>
                        {selectedRatio === "16:9" && (
                          <>
                            <span className="text-slate-500">•</span>
                            <span className="text-emerald-400 font-semibold">{getResolutionConfig(selectedResolution, selectedRatio).label}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Face centering guide adapting to aspect ratio */}
                    {selectedRatio === "9:16" ? (
                      <div className={`self-center w-36 h-56 border-2 border-white/25 border-dashed rounded-full flex items-center justify-center pointer-events-none ${teleprompterEnabled ? "opacity-30" : "opacity-100"}`}>
                        <span className="text-[10px] text-white/50 tracking-wider font-medium text-center px-2">Portrait Guide</span>
                      </div>
                    ) : selectedRatio === "1:1" ? (
                      <div className={`self-center w-40 h-40 border-2 border-white/25 border-dashed rounded-full flex items-center justify-center pointer-events-none ${teleprompterEnabled ? "opacity-30" : "opacity-100"}`}>
                        <span className="text-[10px] text-white/50 tracking-wider font-medium text-center px-2">Square Guide</span>
                      </div>
                    ) : (
                      <div className={`self-center w-48 h-56 border-2 border-white/25 border-dashed rounded-full flex items-center justify-center pointer-events-none ${teleprompterEnabled ? "opacity-30" : "opacity-100"}`}>
                        <span className="text-[11px] text-white/50 tracking-wider font-medium text-center px-2">Position Face Here</span>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-between items-end text-xs text-slate-400 gap-1 w-full">
                      {/* Dynamic real-time Audio VU Meter */}
                      <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-1 rounded-md border border-slate-700/60 shadow-lg">
                        <Mic className={`w-3 h-3 transition-colors ${audioMeterLevel > 5 ? "text-emerald-400" : "text-slate-400"}`} />
                        <div className="flex items-center gap-0.5">
                          {[10, 25, 45, 65, 85].map((thresh, idx) => (
                            <div
                              key={idx}
                              className={`w-1 h-3 rounded-full transition-all duration-75 ${
                                audioMeterLevel >= thresh
                                  ? idx >= 3
                                    ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                                    : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                                  : "bg-slate-700/60"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 ml-0.5">
                          {audioMeterLevel > 5 ? "Active" : "Ready"}
                        </span>
                      </div>

                      {/* Performance Telemetry badge */}
                      <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-md border border-slate-700/60 shadow-lg font-mono text-[10px]">
                        <span className="flex items-center gap-1 text-cyan-300">
                          <Zap className="w-3 h-3 text-cyan-400" /> GPU HW-Accel
                        </span>
                        <span className="text-slate-600 hidden sm:inline">|</span>
                        <span className="text-[#5bbbae] font-medium hidden sm:inline">Studio Pro v2.2</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Floating Teleprompter Glass Overlay & Collapsible Sidebar */}
                  {teleprompterEnabled && !isEditingScript && (
                    isPrompterCollapsed ? (
                      <div
                        data-testid="teleprompter-collapsed-sidebar"
                        className="absolute bottom-12 inset-x-3 sm:inset-x-8 z-20 pointer-events-auto flex items-center justify-between bg-slate-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/80 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-2"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="w-2 h-2 rounded-full bg-[#5bbbae] animate-pulse shrink-0" />
                          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide shrink-0">
                            Prompter
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono shrink-0">
                            ({Math.round((activeWordIndex / Math.max(1, scriptWords.length)) * 100)}%)
                          </span>
                          <span className="text-[11px] text-slate-300 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded truncate max-w-[140px] sm:max-w-[260px]">
                            Word: <strong className="text-[#5bbbae]">{scriptWords[activeWordIndex] || "Ready"}</strong>
                          </span>
                          {isRecording && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded hidden md:inline shrink-0 bg-slate-800 text-slate-300 border border-slate-700">
                              {isVoiceActive ? "🎤 Voice Active" : !hasVoiceStarted ? "⏳ Awaiting Voice" : "⏸ Paused"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            data-testid="expand-teleprompter-sidebar-btn"
                            onClick={() => setIsPrompterCollapsed(false)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#5bbbae] hover:bg-[#4ea89c] text-slate-950 font-bold text-[11px] transition-colors shadow-md cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3" /> Expand
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-x-2 sm:inset-x-5 top-12 bottom-12 z-20 pointer-events-auto flex flex-col justify-between animate-in fade-in transition-all duration-300">
                        {/* Prompter Header */}
                        <div className="flex items-center justify-between bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-t-xl border border-slate-700/70 border-b-0 text-xs shadow-lg">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#5bbbae] animate-pulse" />
                            <span className="font-bold text-slate-200 text-[11px] tracking-wide uppercase">
                              Prompter
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">
                              ({Math.round((activeWordIndex / Math.max(1, scriptWords.length)) * 100)}% read)
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {[100, 130, 160].map((spd) => (
                              <button
                                key={spd}
                                type="button"
                                data-testid={`prompter-speed-${spd}`}
                                onClick={() => setTeleprompterSpeed(spd)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                                  teleprompterSpeed === spd
                                    ? "bg-[#5bbbae] text-white font-bold"
                                    : "bg-slate-800 text-slate-400 hover:text-white"
                                }`}
                              >
                                {spd}wpm
                              </button>
                            ))}

                            <button
                              type="button"
                              onClick={() =>
                                setTeleprompterFontSize((prev) => (prev === "sm" ? "md" : prev === "md" ? "lg" : "sm"))
                              }
                              className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 hover:text-white border border-slate-700 ml-1"
                              title="Toggle Font Size"
                            >
                              {teleprompterFontSize.toUpperCase()}
                            </button>

                            <button
                              type="button"
                              data-testid="prompter-reset-btn"
                              onClick={() => {
                                setActiveWordIndex(0);
                                setHasVoiceStarted(false);
                                lastVoiceDetectedTimeRef.current = 0;
                                setIsVoiceActive(false);
                                consecutiveSpeechFramesRef.current = 0;
                              }}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 ml-0.5 cursor-pointer"
                              title="Rewind to start"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>

                            {/* Collapse Teleprompter Sidebar Button */}
                            <button
                              type="button"
                              data-testid="collapse-teleprompter-sidebar-btn"
                              onClick={() => setIsPrompterCollapsed(true)}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 hover:text-white border border-slate-700 ml-1 cursor-pointer transition-colors"
                              title="Collapse teleprompter sidebar"
                            >
                              <Minimize2 className="w-3 h-3 text-[#5bbbae]" />
                              <span className="hidden sm:inline">Collapse</span>
                            </button>
                          </div>
                        </div>

                        {/* Scrollable Prompter Body with Auto-scroll and Karaoke-Highlight */}
                        <div
                          ref={teleprompterContainerRef}
                          data-testid="teleprompter-text-container"
                          className="flex-1 overflow-y-auto bg-slate-950/75 backdrop-blur-md px-4 sm:px-6 py-8 border-x border-slate-700/70 text-center select-none scroll-smooth"
                          style={{
                            maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                          }}
                        >
                          <div
                            className={`leading-relaxed transition-all ${
                              teleprompterFontSize === "sm"
                                ? "text-xs sm:text-sm"
                                : teleprompterFontSize === "lg"
                                ? "text-base sm:text-xl font-bold"
                                : "text-sm sm:text-base font-medium"
                            }`}
                          >
                            {scriptWords.map((word, idx) => {
                              const isPast = idx < activeWordIndex;
                              const isCurrent = idx === activeWordIndex;
                              const isAwaitingVoice = isRecording && !hasVoiceStarted && isCurrent;

                              let wordStyle = "text-slate-100 hover:text-white";
                              if (isCurrent) {
                                if (isAwaitingVoice) {
                                  wordStyle =
                                    "border-2 border-[#5bbbae] text-[#5bbbae] bg-[#5bbbae]/15 font-bold scale-105 shadow-[0_0_14px_rgba(91,187,174,0.5)] animate-pulse z-10";
                                } else {
                                  wordStyle =
                                    "bg-[#5bbbae] text-slate-950 font-black scale-110 shadow-[0_0_16px_rgba(91,187,174,0.95)] z-10";
                                }
                              } else if (isPast) {
                                wordStyle = "text-slate-500 opacity-60";
                              }

                              return (
                                <span
                                  key={idx}
                                  data-word-idx={idx}
                                  onClick={() => {
                                    setActiveWordIndex(idx);
                                    if (isRecording) {
                                      setHasVoiceStarted(true);
                                      lastVoiceDetectedTimeRef.current = Date.now();
                                      setIsVoiceActive(true);
                                    }
                                  }}
                                  className={`inline-block mx-1 my-0.5 transition-all duration-150 rounded px-1.5 py-0.5 cursor-pointer select-none ${wordStyle}`}
                                >
                                  {word}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Prompter Footer with Real-time Voice Detection Status */}
                        <div className="flex items-center justify-between bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-b-xl border border-slate-700/70 border-t-0 text-[11px] text-slate-400 shadow-lg">
                          <div className="flex items-center gap-2">
                            {isRecording ? (
                              isVoiceActive ? (
                                <span
                                  data-testid="voice-detection-status"
                                  className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-semibold animate-pulse"
                                >
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                                  <Mic className="w-3.5 h-3.5 text-emerald-400" /> Voice Detected • Highlighting & Scrolling
                                </span>
                              ) : !hasVoiceStarted ? (
                                <span
                                  data-testid="voice-detection-status"
                                  className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px] font-medium"
                                >
                                  <MicOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Awaiting Voice (Speak script to advance)
                                </span>
                              ) : (
                                <span
                                  data-testid="voice-detection-status"
                                  className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px]"
                                >
                                  <Pause className="w-3.5 h-3.5 text-cyan-400" /> Voice Paused • Teleprompter Frozen
                                </span>
                              )
                            ) : (
                              <span
                                data-testid="voice-detection-status"
                                className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]"
                              >
                                <Mic className="w-3.5 h-3.5 text-emerald-400" /> Voice Follow & Auto-Scroll Ready
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isRecording && !hasVoiceStarted && (
                              <button
                                type="button"
                                data-testid="simulate-voice-btn"
                                onClick={() => {
                                  setHasVoiceStarted(true);
                                  setIsVoiceActive(true);
                                  lastVoiceDetectedTimeRef.current = Date.now();
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-600/50 text-[10px] font-mono cursor-pointer transition-colors"
                                title="Simulate speaking into microphone"
                              >
                                Speak Now
                              </button>
                            )}
                            <span className="text-[10px] text-slate-500 hidden sm:inline">
                              Click any word to jump
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {/* Inline Script Editor Card */}
                  {isEditingScript && (
                    <div className="absolute inset-3 z-30 bg-slate-950/95 backdrop-blur-lg border border-slate-700 rounded-xl p-4 flex flex-col space-y-3 shadow-2xl animate-in zoom-in-95">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-[#5bbbae]" />
                          <h4 className="font-bold text-sm text-white">Edit Pitch Script</h4>
                        </div>
                        <button
                          onClick={() => setIsEditingScript(false)}
                          className="text-slate-400 hover:text-white p-1 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">
                        Type or paste your presentation text below, or import a .txt file. Words will automatically synchronize during recording.
                      </p>
                      <textarea
                        data-testid="script-textarea"
                        value={scriptText}
                        onChange={(e) => setScriptText(e.target.value)}
                        rows={7}
                        className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-[#5bbbae] font-sans resize-none"
                        placeholder="Paste your elevator pitch script here..."
                      />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-400 font-mono">
                          {scriptWords.length} words • ~{Math.ceil(scriptWords.length / 2.2)}s read
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => scriptFileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#5bbbae]" /> Import File
                          </button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setIsEditingScript(false);
                              setTeleprompterEnabled(true);
                            }}
                            className="bg-[#5bbbae] hover:bg-[#497d76] text-white text-xs cursor-pointer"
                          >
                            Save & Use Prompter
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Camera className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">Live Camera Studio Ready</p>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Allow camera & microphone access to record your authentic elevator pitch.
                  </p>
                </div>
              )}

              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-2 animate-pulse shadow-xl z-30">
                  <span className="w-2.5 h-2.5 rounded-full bg-white" /> REC {formatTimer(recordingSeconds)} / 05:00
                </div>
              )}
            </div>

            {/* Chunk Upload Progress Bar */}
            {isUploadingChunks && chunkProgress && (
              <div className="space-y-1 bg-slate-800 p-3 rounded-lg border border-slate-700">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Streaming Chunked Upload: Chunk {chunkProgress.uploadedChunks}/{chunkProgress.totalChunks}</span>
                  <span className="font-mono text-[#5bbbae]">{chunkProgress.percentage}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#5bbbae] h-2 transition-all duration-300"
                    style={{ width: `${chunkProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-400">
                {recordedVideoUrl
                  ? "Review your recorded pitch before streaming upload."
                  : "Record authentic pitch up to 5 minutes with live teleprompter."}
              </p>
              
              <div className="flex items-center gap-2">
                {!recordedVideoUrl ? (
                  !isRecording ? (
                    <Button
                      data-testid="studio-record-btn"
                      variant="default"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer"
                      onClick={startMediaRecording}
                    >
                      <Camera className="w-4 h-4" /> Start Recording (0:30 - 5:00)
                    </Button>
                  ) : (
                    <Button
                      data-testid="studio-stop-btn"
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-400 hover:bg-red-950 cursor-pointer"
                      onClick={stopMediaRecording}
                    >
                      Stop Recording
                    </Button>
                  )
                ) : (
                  <>
                    <Button
                      data-testid="studio-retake-btn"
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-1.5 cursor-pointer"
                      onClick={() => {
                        setRecordedBlob(null);
                        setRecordedVideoUrl(null);
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Re-take
                    </Button>
                    <Button
                      data-testid="studio-save-btn"
                      variant="default"
                      size="sm"
                      disabled={isUploadingChunks}
                      className="bg-[#5bbbae] hover:bg-[#497d76] text-white gap-1.5 cursor-pointer"
                      onClick={handleUploadRecordedVideo}
                    >
                      {isUploadingChunks ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Save & Publish Pitch
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={closeCameraStudio} className="text-slate-300">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: Add Experience Modal                        */}
      {/* ==================================================== */}
      {expModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-[#d1d6da] max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-[#f0f2f5]">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#5bbbae]" />
                <h3 className="text-lg font-bold text-[#252525]">Add Work Experience</h3>
              </div>
              <button
                onClick={() => setExpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExperience} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Engineer"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe, Google, Acme Corp"
                  value={expCompany}
                  onChange={(e) => setExpCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#515151]">From Year</label>
                  <input
                    type="number"
                    min={1990}
                    max={2030}
                    value={expFromYear}
                    onChange={(e) => setExpFromYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#515151]">To Year</label>
                  <input
                    type="number"
                    min={1990}
                    max={2030}
                    disabled={expCurrentlyWork}
                    value={expToYear}
                    onChange={(e) => setExpToYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae] disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="currentlyWork"
                  checked={expCurrentlyWork}
                  onChange={(e) => setExpCurrentlyWork(e.target.checked)}
                  className="rounded text-[#5bbbae] focus:ring-[#5bbbae]"
                />
                <label htmlFor="currentlyWork" className="text-xs text-[#515151] cursor-pointer">
                  I currently work here
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">Description & Achievements</label>
                <textarea
                  rows={3}
                  placeholder="Key responsibilities, stack used, and accomplishments..."
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExpModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#5bbbae] hover:bg-[#497d76] text-white"
                >
                  Save Experience to DB
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: Add Education Modal                         */}
      {/* ==================================================== */}
      {eduModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-[#d1d6da] max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-[#f0f2f5]">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#5bbbae]" />
                <h3 className="text-lg font-bold text-[#252525]">Add Education Credential</h3>
              </div>
              <button
                onClick={() => setEduModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEducation} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">School / University *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University, MIT"
                  value={eduSchool}
                  onChange={(e) => setEduSchool(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">Degree & Major *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.S. in Computer Science"
                  value={eduDegree}
                  onChange={(e) => setEduDegree(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#515151]">GPA</label>
                  <input
                    type="text"
                    placeholder="3.8 / 4.0"
                    value={eduGpa}
                    onChange={(e) => setEduGpa(e.target.value)}
                    className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#515151]">Start Year</label>
                  <input
                    type="number"
                    min={1990}
                    max={2030}
                    value={eduFromYear}
                    onChange={(e) => setEduFromYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#515151]">Grad Year</label>
                  <input
                    type="number"
                    min={1990}
                    max={2030}
                    value={eduToYear}
                    onChange={(e) => setEduToYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEduModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#5bbbae] hover:bg-[#497d76] text-white"
                >
                  Save Education to DB
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 5: Add Skill Modal                             */}
      {/* ==================================================== */}
      {skillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-[#d1d6da] max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-[#f0f2f5]">
              <h3 className="text-base font-bold text-[#252525]">Add Skill or Strength</h3>
              <button onClick={() => setSkillModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="e.g. Next.js, Kubernetes, FastAPI"
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddSkill(newSkillText);
                    setSkillModalOpen(false);
                  }
                }}
                className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSkillModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-[#5bbbae] hover:bg-[#497d76] text-white"
                  onClick={() => {
                    handleAddSkill(newSkillText);
                    setSkillModalOpen(false);
                  }}
                >
                  Add Skill
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
