import React, { useState } from "react";
import { ActionButton, ScreenShell, SurfaceCard } from "@/lib/native-runtime";
import {
  createValidMobileUploadId,
  useMobileChunkUploadMutation,
  useMobileTeleprompterMutation,
} from "@/hooks/use-mobile-studio";

export default function MobilePitchStudioScreen() {
  const [targetRole, setTargetRole] = useState("Staff Backend Engineer");
  const [jobDescription, setJobDescription] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const teleprompterMutation = useMobileTeleprompterMutation();
  const chunkUploadMutation = useMobileChunkUploadMutation();

  const handleGenerateScript = async () => {
    await teleprompterMutation.mutateAsync({ targetRole, jobDescription });
  };

  const handleStartChunkUpload = async () => {
    const uploadId = createValidMobileUploadId();
    const res = await chunkUploadMutation.mutateAsync({
      uploadId,
      chunksBase64: ["chunk_0_h264", "chunk_1_h264", "chunk_2_h264"],
      onProgress: (pct) => setUploadPercent(pct),
    });
    setUploadedUrl(res.video_url);
  };

  return (
    <ScreenShell testID="mobile-pitch-studio-screen" mode="dark">
      <SurfaceCard testID="mobile-teleprompter-card" mode="dark">
        <h1 data-testid="mobile-studio-title">60s Video Elevator Pitch Studio</h1>
        <input
          data-testid="mobile-studio-role-input"
          value={targetRole}
          placeholder="Target Role"
          onChange={(e) => setTargetRole(e.target.value)}
        />
        <textarea
          data-testid="mobile-studio-jd-input"
          value={jobDescription}
          placeholder="Paste key job requirements for AI Teleprompter..."
          onChange={(e) => setJobDescription(e.target.value)}
        />
        <ActionButton
          testID="mobile-studio-generate-script"
          label={
            teleprompterMutation.isPending ? "Generating Script..." : "Generate AI Teleprompter Script"
          }
          disabled={teleprompterMutation.isPending}
          onPress={handleGenerateScript}
        />
        {teleprompterMutation.data ? (
          <p data-testid="mobile-studio-script-output">
            {teleprompterMutation.data.elevator_pitch_script}
          </p>
        ) : null}
      </SurfaceCard>

      <SurfaceCard testID="mobile-camera-upload-card" mode="dark">
        <div data-testid="mobile-studio-upload-progress">Upload Progress: {uploadPercent}%</div>
        {uploadedUrl ? (
          <div data-testid="mobile-studio-uploaded-url">Published Pitch: {uploadedUrl}</div>
        ) : null}
        <ActionButton
          testID="mobile-studio-upload-chunks"
          label={
            chunkUploadMutation.isPending
              ? "Uploading Video Chunks..."
              : "Record & Upload 60s Pitch"
          }
          disabled={chunkUploadMutation.isPending}
          onPress={handleStartChunkUpload}
        />
      </SurfaceCard>
    </ScreenShell>
  );
}
