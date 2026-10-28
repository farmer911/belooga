import React, { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as DocumentPicker from "expo-document-picker";
import { router, useIsFocused } from "expo-router";
import { loadMobileProfileCvText } from "@/hooks/use-mobile-parity-part2";
import {
  createValidMobileUploadId,
  extractMobileCvFile,
  useMobileAtsHistoryQuery,
  useMobileAtsScanMutation,
  useMobilePitchUploadMutation,
  useMobileTeleprompterMutation,
  useMobileVideoStatusQuery,
} from "@/hooks/use-mobile-studio";
import { Body, Button, Card, ErrorText, Field, H1, H2, Pill, Row, Screen, Well } from "@/lib/ui";
import { useMobileAuthStore } from "@/store/auth-store";

const MAX_PITCH_SECONDS = 60;

function PitchRecorder({ username }: { username: string }) {
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const uploadMutation = useMobilePitchUploadMutation();
  const videoStatusQuery = useMobileVideoStatusQuery(username);

  const hasPermissions = Boolean(cameraPermission?.granted && micPermission?.granted);

  const openCamera = async () => {
    const cam = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    const mic = micPermission?.granted ? micPermission : await requestMicPermission();
    if (cam.granted && mic.granted) setCameraOpen(true);
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;
    setRecordError(null);
    setIsRecording(true);
    try {
      // Resolves when stopRecording() is called or maxDuration is reached.
      const video = await cameraRef.current.recordAsync({ maxDuration: MAX_PITCH_SECONDS });
      if (!video?.uri) throw new Error("Recording produced no file");
      setCameraOpen(false);
      setUploadPercent(0);
      uploadMutation.mutate({
        uploadId: createValidMobileUploadId(),
        username,
        fileUri: video.uri,
        onProgress: setUploadPercent,
      });
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Recording failed");
    } finally {
      setIsRecording(false);
    }
  };

  const publishedUrl = uploadMutation.data?.video_url ?? videoStatusQuery.data?.video_url ?? null;

  return (
    <Card testID="mobile-camera-upload-card">
      <Row style={{ justifyContent: "space-between" }}>
        <H2>Record Your 60s Pitch</H2>
        <Pill testID="mobile-studio-video-transcode-status" label={`Transcode: ${videoStatusQuery.data?.status ?? "—"}`} />
      </Row>
      {cameraOpen && isFocused ? (
        <View style={styles.cameraFrame}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" mode="video" />
        </View>
      ) : null}
      {cameraOpen ? (
        <Row>
          <Button
            testID="mobile-studio-record-btn"
            label={isRecording ? "Stop & Upload" : "Start Recording"}
            variant={isRecording ? "danger" : "primary"}
            onPress={() => (isRecording ? cameraRef.current?.stopRecording() : void startRecording())}
          />
          {!isRecording ? (
            <Button testID="mobile-studio-close-camera" label="Cancel" variant="secondary" onPress={() => setCameraOpen(false)} />
          ) : null}
        </Row>
      ) : (
        <Button
          testID="mobile-studio-open-camera"
          label={uploadMutation.isPending ? "Uploading Pitch..." : "Record & Upload 60s Pitch"}
          disabled={uploadMutation.isPending}
          onPress={() => void openCamera()}
        />
      )}
      {!hasPermissions && (cameraPermission?.canAskAgain === false || micPermission?.canAskAgain === false) ? (
        <Body tone="warning">Camera or microphone access is blocked. Enable it in system settings to record.</Body>
      ) : null}
      {uploadMutation.isPending || uploadPercent > 0 ? (
        <Body testID="mobile-studio-upload-progress" tone="brand">
          Upload Progress: {uploadPercent}%
        </Body>
      ) : null}
      {recordError ? <Body tone="danger">{recordError}</Body> : null}
      <ErrorText testID="mobile-studio-upload-error" error={uploadMutation.error} />
      {publishedUrl ? <Body testID="mobile-studio-uploaded-url">Published Pitch: {publishedUrl}</Body> : null}
    </Card>
  );
}

export default function StudioScreen() {
  const username = useMobileAuthStore((s) => s.user?.username);
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvError, setCvError] = useState<string | null>(null);

  const teleprompterMutation = useMobileTeleprompterMutation();
  const atsScanMutation = useMobileAtsScanMutation();
  const atsHistoryQuery = useMobileAtsHistoryQuery();

  const runAtsScan = (cv: string) => {
    if (!cv.trim() || !jobDescription.trim()) {
      setCvError("Add your CV text and a job description before scanning.");
      return;
    }
    setCvError(null);
    atsScanMutation.mutate({ cvText: cv, jdText: jobDescription });
  };

  const pickCvFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    try {
      const res = await extractMobileCvFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      setCvText(res.extracted_text);
      setCvError(null);
    } catch (err) {
      setCvError(err instanceof Error ? err.message : "Could not read CV file");
    }
  };

  const loadProfileCv = async () => {
    if (!username) return;
    try {
      setCvText(await loadMobileProfileCvText(username));
      setCvError(null);
    } catch (err) {
      setCvError(err instanceof Error ? err.message : "Could not load profile CV");
    }
  };

  return (
    <Screen testID="mobile-pitch-studio-screen">
      <Card testID="mobile-teleprompter-card">
        <H1 testID="mobile-studio-title">60s Video Elevator Pitch Studio</H1>
        <Field testID="mobile-studio-role-input" value={targetRole} placeholder="Target role" onChangeText={setTargetRole} autoCapitalize="words" />
        <Field
          testID="mobile-studio-jd-input"
          value={jobDescription}
          placeholder="Paste key job requirements for the AI teleprompter & ATS scan..."
          onChangeText={setJobDescription}
          multiline
        />
        <Field testID="mobile-studio-cv-input" value={cvText} placeholder="Your CV text" onChangeText={setCvText} multiline />
        <Row>
          <Button
            testID="mobile-studio-generate-script"
            label={teleprompterMutation.isPending ? "Generating..." : "Generate Teleprompter Script"}
            disabled={teleprompterMutation.isPending || !targetRole.trim()}
            onPress={() => teleprompterMutation.mutate({ targetRole, jobDescription })}
          />
          <Button
            testID="mobile-studio-ats-scan"
            label={atsScanMutation.isPending ? "Scanning..." : "Run ATS Match Scan"}
            variant="secondary"
            disabled={atsScanMutation.isPending}
            onPress={() => runAtsScan(cvText)}
          />
        </Row>
        <Row>
          <Button testID="mobile-ats-upload-file-btn" label="Tải File CV (PDF/DOCX)" variant="secondary" onPress={() => void pickCvFile()} />
          {username ? (
            <Button testID="mobile-ats-load-profile-btn" label="Nạp CV Hồ Sơ" variant="secondary" onPress={() => void loadProfileCv()} />
          ) : null}
        </Row>
        {cvError ? <Body tone="danger">{cvError}</Body> : null}
        <ErrorText error={teleprompterMutation.error ?? atsScanMutation.error} />
        {teleprompterMutation.data ? (
          <Well testID="mobile-studio-script-output">
            <Body>{teleprompterMutation.data.elevator_pitch_script}</Body>
          </Well>
        ) : null}
        {atsScanMutation.data ? (
          <Body testID="mobile-studio-ats-score" tone="brand">
            ATS Compatibility Score: {atsScanMutation.data.match_score}%
          </Body>
        ) : null}
        {atsHistoryQuery.data ? <Pill label={`${atsHistoryQuery.data.length} past scans`} tone="neutral" /> : null}
      </Card>

      {username ? (
        <PitchRecorder username={username} />
      ) : (
        <Card testID="mobile-camera-upload-card">
          <Body>Sign in to record and publish your video pitch.</Body>
          <Button testID="mobile-studio-signin" label="Sign In" onPress={() => router.push("/login")} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cameraFrame: { height: 360, borderRadius: 16, overflow: "hidden", backgroundColor: "#000" },
});
