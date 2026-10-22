import React, { useState } from "react";
import { ActionButton, BadgePill, ScreenShell, SurfaceCard } from "@/lib/native-runtime";
import {
  createValidMobileUploadId,
  useMobileAtsHistoryQuery,
  useMobileAtsScanMutation,
  useMobileChunkUploadMutation,
  useMobileTeleprompterMutation,
} from "@/hooks/use-mobile-studio";
import { getSemanticTokens } from "@/theme/tokens";

export default function MobilePitchStudioScreen() {
  const tokens = getSemanticTokens("dark");
  const [targetRole, setTargetRole] = useState("Staff Backend Engineer");
  const [jobDescription, setJobDescription] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const teleprompterMutation = useMobileTeleprompterMutation();
  const chunkUploadMutation = useMobileChunkUploadMutation();
  const atsScanMutation = useMobileAtsScanMutation();
  const atsHistoryQuery = useMobileAtsHistoryQuery();

  const handleGenerateScript = async () => {
    await teleprompterMutation.mutateAsync({ targetRole, jobDescription });
  };

  const handleRunAtsScan = async () => {
    await atsScanMutation.mutateAsync({
      cvText: `${targetRole} • Python • FastAPI • PostgreSQL 16 • React Native`,
      jdText: jobDescription || "Distributed systems with FastAPI and PostgreSQL 16",
    });
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <BadgePill label="WEBRTC 60S STUDIO • H.264" tone="brand" />
          <BadgePill label="1080P 60FPS READY" tone="success" />
        </div>
        <h1
          data-testid="mobile-studio-title"
          style={{ margin: 0, fontSize: 20, fontWeight: 800, color: tokens.typography.heading }}
        >
          60s Video Elevator Pitch Studio
        </h1>
        <input
          data-testid="mobile-studio-role-input"
          value={targetRole}
          placeholder="Target Role"
          onChange={(e) => setTargetRole(e.target.value)}
          style={{
            backgroundColor: tokens.surface.elevated,
            color: tokens.typography.main,
            border: `1px solid ${tokens.surface.border}`,
            borderRadius: 12,
            padding: "11px 14px",
          }}
        />
        <textarea
          data-testid="mobile-studio-jd-input"
          value={jobDescription}
          placeholder="Paste key job requirements for AI Teleprompter & ATS Scan..."
          onChange={(e) => setJobDescription(e.target.value)}
          style={{
            backgroundColor: tokens.surface.elevated,
            color: tokens.typography.main,
            border: `1px solid ${tokens.surface.border}`,
            borderRadius: 12,
            padding: "11px 14px",
            minHeight: 72,
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <ActionButton
            testID="mobile-studio-generate-script"
            label={
              teleprompterMutation.isPending ? "Generating..." : "Generate AI Teleprompter Script"
            }
            variant="accent"
            disabled={teleprompterMutation.isPending}
            onPress={handleGenerateScript}
          />
          <ActionButton
            testID="mobile-studio-ats-scan"
            label={atsScanMutation.isPending ? "Scanning..." : "Run ATS Match Scan"}
            variant="secondary"
            disabled={atsScanMutation.isPending}
            onPress={handleRunAtsScan}
          />
        </div>
        {teleprompterMutation.data ? (
          <p
            data-testid="mobile-studio-script-output"
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 12,
              backgroundColor: tokens.surface.elevated,
              color: tokens.typography.main,
            }}
          >
            {teleprompterMutation.data.elevator_pitch_script}
          </p>
        ) : null}
        {atsScanMutation.data ? (
          <div data-testid="mobile-studio-ats-score">
            ATS Compatibility Score: {atsScanMutation.data.match_score}%
          </div>
        ) : null}
      </SurfaceCard>

      <SurfaceCard testID="mobile-camera-upload-card" mode="dark">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div data-testid="mobile-studio-upload-progress" style={{ fontWeight: 700, color: tokens.brand.primary }}>
            Upload Progress: {uploadPercent}% {uploadPercent === 100 ? "(3/3 Chunks Assembled)" : ""}
          </div>
          <BadgePill label={`${(atsHistoryQuery.data ?? []).length} Scans`} tone="neutral" />
        </div>
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
