"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import { useCandidateProfile } from "@/hooks/use-candidate-profile";
import { WorkspaceToolbar } from "@/components/features/profile/workspace-toolbar";
import { AuthSessionBootstrap } from "@/components/providers/auth-guard";
import { ProfileHeaderCard } from "@/components/features/profile/profile-header-card";
import { SkillsCard } from "@/components/features/profile/skills-card";
import { LanguagesInterestsCard } from "@/components/features/profile/languages-interests-card";
import { ExperienceTimeline } from "@/components/features/timeline/experience-timeline";
import { EducationTimeline } from "@/components/features/timeline/education-timeline";
import { AwardsTimeline } from "@/components/features/timeline/awards-timeline";
import { VideoPitchCard } from "@/components/features/media/video-pitch-card";
import { VideoPitchModal } from "@/components/features/media/video-pitch-modal";
import { ResumeAttachmentCard } from "@/components/features/media/resume-attachment-card";

interface WorkspaceTrustScore {
  trust_score: number;
  readiness_tier: string;
  recruiter_conversion_multiplier: number;
  next_boost_action: string;
}

interface WorkspaceCareerTrajectory {
  current_inferred_level: string;
  next_target_level: string;
  promotion_readiness_pct: number;
}

const WebRTCStudioModal = dynamic(
  () => import("@/components/features/studio/webrtc-studio-modal"),
  { ssr: false }
);

export default function WorkspacePage() {
  const params = useParams();
  const username = (params.username as string).toLowerCase().trim();

  const {
    profile, setProfile, isLoading, experiences, education, skills, resumeName, avatarPreview,
    isUploadingAvatar, isUploadingResume, resumeInputRef, avatarInputRef, handleToggleVisibility,
    handleAddExperience, handleUpdateExperience, handleDeleteExperience, handleReorderExperiences,
    handleAddEducation, handleUpdateEducation, handleDeleteEducation, handleReorderEducation,
    handleUpdateAward, handleReorderAwards, handleAddSkill, handleRemoveSkill, handleAddLanguage,
    handleRemoveLanguage, handleAddInterest, handleRemoveInterest, handleAvatarFileChange,
    handleResumeFileChange, handleDeleteResume, handleDownloadPdf,
  } = useCandidateProfile(username);

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [studioModalOpen, setStudioModalOpen] = useState(false);

  const { data: trustCopilot = null } = useQuery<WorkspaceTrustScore | null>({
    queryKey: ["workspace-trust-score", username, skills.length, experiences.length],
    queryFn: async () => (await apiClient.get<WorkspaceTrustScore>(`/v1/profile/${username}/trust-score`)).data,
    enabled: Boolean(profile),
  });

  const { data: careerTrajectory = null } = useQuery<WorkspaceCareerTrajectory | null>({
    queryKey: ["workspace-career-trajectory", username, experiences.length],
    queryFn: async () => (await apiClient.get<WorkspaceCareerTrajectory>(`/v1/profile/${username}/career-trajectory`)).data,
    enabled: Boolean(profile),
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" data-testid="workspace-loading-spinner">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4" data-testid="workspace-error-banner">
        <h2 className="text-2xl font-bold text-typography-main">Candidate Profile Not Found</h2>
        <p className="text-sm text-typography-muted">The profile @{username} does not exist or is set to private.</p>
        <Link href="/">
          <Button variant="default">Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page py-8" data-testid="workspace-container">
      <AuthSessionBootstrap />
      <input type="file" ref={resumeInputRef} accept=".pdf" className="hidden" onChange={handleResumeFileChange} />
      <input type="file" id="avatar-upload-input" ref={avatarInputRef} accept="image/*" className="hidden" onChange={handleAvatarFileChange} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <WorkspaceToolbar
          username={username}
          isHidden={profile.is_hidden}
          onToggleVisibility={handleToggleVisibility}
          onDownloadPdf={handleDownloadPdf}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <ProfileHeaderCard
              profile={profile}
              avatarPreview={avatarPreview}
              isUploadingAvatar={isUploadingAvatar}
              onAvatarUploadClick={() => avatarInputRef.current?.click()}
            />
            {trustCopilot && (
              <div
                data-testid="workspace-trust-copilot-card"
                className="bg-surface-card rounded-xl border border-teal-200 p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    {trustCopilot.readiness_tier}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-extrabold border border-teal-200">
                    {trustCopilot.trust_score}/100 ({trustCopilot.recruiter_conversion_multiplier}x)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    {trustCopilot.next_boost_action}
                    {careerTrajectory ? ` · ${careerTrajectory.current_inferred_level} → ${careerTrajectory.next_target_level} (${careerTrajectory.promotion_readiness_pct}%)` : ""}
                  </span>
                </p>
              </div>
            )}
            <SkillsCard
              skills={skills}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
            />
            <LanguagesInterestsCard
              languages={profile.languages}
              interests={profile.interests}
              onAddLanguage={handleAddLanguage}
              onRemoveLanguage={handleRemoveLanguage}
              onAddInterest={handleAddInterest}
              onRemoveInterest={handleRemoveInterest}
            />
          </aside>

          <main className="lg:col-span-8 space-y-8">
            <VideoPitchCard
              posterUrl={profile.video_pitch_poster}
              onPlayClick={() => setVideoModalOpen(true)}
              onRecordClick={() => setStudioModalOpen(true)}
              isEditable={true}
            />
            <ExperienceTimeline
              experiences={experiences}
              onAddExperience={handleAddExperience}
              onUpdate={handleUpdateExperience}
              onUpdateExperience={handleUpdateExperience}
              onDeleteExperience={handleDeleteExperience}
              onReorderExperiences={handleReorderExperiences}
            />
            <EducationTimeline
              education={education}
              onAddEducation={handleAddEducation}
              onUpdateEducation={handleUpdateEducation}
              onDeleteEducation={handleDeleteEducation}
              onReorderEducation={handleReorderEducation}
            />
            <AwardsTimeline
              username={username}
              onUpdateAward={handleUpdateAward}
              onReorderAwards={handleReorderAwards}
            />
            <ResumeAttachmentCard
              resumeName={resumeName}
              isUploadingResume={isUploadingResume}
              onUploadClick={() => resumeInputRef.current?.click()}
              onDeleteResume={handleDeleteResume}
              onDownloadPdf={handleDownloadPdf}
            />
          </main>
        </div>
      </div>

      <VideoPitchModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        candidateName={profile.full_name}
        videoUrl={profile.video_pitch_url}
        posterUrl={profile.video_pitch_poster}
      />

      {studioModalOpen && (
        <WebRTCStudioModal
          isOpen={studioModalOpen}
          onClose={() => setStudioModalOpen(false)}
          candidateName={profile.full_name}
          username={username}
          onUploadSuccess={(videoUrl, posterUrl) => {
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    video_pitch_url: videoUrl,
                    video_pitch_poster: posterUrl || prev.video_pitch_poster,
                  }
                : null
            );
          }}
        />
      )}
    </div>
  );
}
