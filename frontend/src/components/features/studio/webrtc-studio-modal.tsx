"use client";

import * as React from "react";
import { Video, X, Camera, RotateCcw, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebRTCStudio } from "@/hooks/use-webrtc-studio";
import { StudioToolbar } from "./studio-toolbar";
import { StudioViewfinder } from "./studio-viewfinder";
import { TeleprompterOverlay } from "./teleprompter-overlay";

export interface WebRTCStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  username: string;
  onUploadSuccess?: (videoUrl: string, posterUrl?: string) => void;
}

export function WebRTCStudioModal({
  isOpen,
  onClose,
  candidateName,
  username,
  onUploadSuccess,
}: WebRTCStudioModalProps) {
  const {
    mediaStream,
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
  } = useWebRTCStudio(isOpen, candidateName, username, onUploadSuccess);

  React.useEffect(() => {
    if (isOpen) {
      startStudio();
    } else {
      closeStudio();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    closeStudio();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-w-3xl w-full shadow-2xl space-y-4 p-6 text-white relative">
        {/* Header */}
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
          <button onClick={handleClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <StudioToolbar
          videoDevices={videoDevices}
          selectedDeviceId={selectedDeviceId}
          onDeviceChange={handleDeviceChange}
          audioDevices={audioDevices}
          selectedAudioDeviceId={selectedAudioDeviceId}
          onAudioDeviceChange={handleAudioDeviceChange}
          audioMeterLevel={audioMeterLevel}
          selectedResolution={selectedResolution}
          onResolutionChange={handleResolutionChange}
          selectedRatio={selectedRatio}
          onRatioChange={handleRatioChange}
          isRecording={isRecording}
          hasRecordedVideo={Boolean(recordedVideoUrl)}
          teleprompterEnabled={prompter.teleprompterEnabled}
          onTogglePrompter={() => prompter.setTeleprompterEnabled(!prompter.teleprompterEnabled)}
          isPrompterCollapsed={prompter.isPrompterCollapsed}
          onToggleCollapsePrompter={() => prompter.setIsPrompterCollapsed(!prompter.isPrompterCollapsed)}
          onImportClick={() => prompter.scriptFileInputRef.current?.click()}
          onFileChange={prompter.handleImportScriptFile}
          fileInputRef={prompter.scriptFileInputRef}
          onEditClick={() => prompter.setIsEditingScript(!prompter.isEditingScript)}
        />

        {/* Viewfinder with nested Teleprompter */}
        <StudioViewfinder
          recordedVideoUrl={recordedVideoUrl}
          mediaStream={mediaStream}
          attachWebcamRef={attachWebcamRef}
          selectedResolution={selectedResolution}
          selectedRatio={selectedRatio}
          audioMeterLevel={audioMeterLevel}
          isRecording={isRecording}
          recordingSeconds={recordingSeconds}
          formatTimer={formatTimer}
          isPrompterActive={prompter.teleprompterEnabled}
          isOpen={isOpen}
        >
          <TeleprompterOverlay
            teleprompterEnabled={prompter.teleprompterEnabled}
            isPrompterCollapsed={prompter.isPrompterCollapsed}
            setIsPrompterCollapsed={prompter.setIsPrompterCollapsed}
            scriptText={prompter.scriptText}
            setScriptText={prompter.setScriptText}
            scriptWords={prompter.scriptWords}
            activeWordIndex={prompter.activeWordIndex}
            setActiveWordIndex={prompter.setActiveWordIndex}
            teleprompterSpeed={prompter.teleprompterSpeed}
            setTeleprompterSpeed={prompter.setTeleprompterSpeed}
            teleprompterFontSize={prompter.teleprompterFontSize}
            setTeleprompterFontSize={prompter.setTeleprompterFontSize}
            isEditingScript={prompter.isEditingScript}
            setIsEditingScript={prompter.setIsEditingScript}
            isRecording={isRecording}
            isVoiceActive={prompter.isVoiceActive}
            hasVoiceStarted={prompter.hasVoiceStarted}
            teleprompterContainerRef={prompter.teleprompterContainerRef}
            scriptFileInputRef={prompter.scriptFileInputRef}
            onWordClick={(idx) => {
              prompter.setActiveWordIndex(idx);
              if (isRecording) prompter.simulateVoice();
            }}
            onResetPrompter={prompter.resetPrompter}
            onSimulateVoice={prompter.simulateVoice}
          />
        </StudioViewfinder>

        {/* Progress Bar */}
        {isUploadingChunks && chunkProgress && (
          <div className="space-y-1 bg-slate-800 p-3 rounded-lg border border-slate-700">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Streaming Chunked Upload: Chunk {chunkProgress.uploadedChunks}/{chunkProgress.totalChunks}</span>
              <span className="font-mono text-[#5bbbae]">{chunkProgress.percentage}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div className="bg-[#5bbbae] h-2 transition-all duration-300" style={{ width: `${chunkProgress.percentage}%` }} />
            </div>
          </div>
        )}

        {/* Footer */}
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
                  onClick={startRecording}
                >
                  <Camera className="w-4 h-4" /> Start Recording (0:30 - 5:00)
                </Button>
              ) : (
                <Button
                  data-testid="studio-stop-btn"
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-400 hover:bg-red-950 cursor-pointer"
                  onClick={stopRecording}
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
                  onClick={retake}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-take
                </Button>
                <Button
                  data-testid="studio-save-btn"
                  variant="default"
                  size="sm"
                  disabled={isUploadingChunks}
                  className="bg-[#5bbbae] hover:bg-[#497d76] text-white gap-1.5 cursor-pointer"
                  onClick={uploadPitch}
                >
                  {isUploadingChunks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Save & Publish Pitch
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-slate-300">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebRTCStudioModal;
