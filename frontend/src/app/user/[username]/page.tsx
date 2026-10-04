"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useCandidateProfile } from "@/hooks/use-candidate-profile";
import { WorkspaceToolbar } from "@/components/features/profile/workspace-toolbar";
import { ProfileHeaderCard } from "@/components/features/profile/profile-header-card";
import { SkillsCard } from "@/components/features/profile/skills-card";
import { LanguagesInterestsCard } from "@/components/features/profile/languages-interests-card";
import { ExperienceTimeline } from "@/components/features/timeline/experience-timeline";
import { EducationTimeline } from "@/components/features/timeline/education-timeline";
import { VideoPitchCard } from "@/components/features/media/video-pitch-card";
import { VideoPitchModal } from "@/components/features/media/video-pitch-modal";
import { ResumeAttachmentCard } from "@/components/features/media/resume-attachment-card";

// Lazy-load WebRTC Studio Modal with Next.js dynamic import (SSR disabled)
const WebRTCStudioModal = dynamic(
  () => import("@/components/features/studio/webrtc-studio-modal"),
  { ssr: false }
);

export default function WorkspacePage() {
  const params = useParams();
  const username = (params.username as string).toLowerCase().trim();

  const {
    profile,
    setProfile,
    isLoading,
    experiences,
    education,
    skills,
    resumeName,
    avatarPreview,
    isUploadingAvatar,
    isUploadingResume,
    resumeInputRef,
    avatarInputRef,
    handleToggleVisibility,
    handleAddExperience,
    handleDeleteExperience,
    handleReorderExperiences,
    handleAddEducation,
    handleDeleteEducation,
    handleAddSkill,
    handleRemoveSkill,
    handleAvatarFileChange,
    handleResumeFileChange,
    handleDownloadPdf,
  } = useCandidateProfile(username);

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [studioModalOpen, setStudioModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" data-testid="workspace-loading-spinner">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5bbbae]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4" data-testid="workspace-error-banner">
        <h2 className="text-2xl font-bold text-[#252525]">Candidate Profile Not Found</h2>
        <p className="text-sm text-[#737475]">The profile @{username} does not exist or is set to private.</p>
        <Link href="/">
          <Button variant="default">Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-8" data-testid="workspace-container">
      {/* Hidden file inputs for avatar & resume */}
      <input type="file" ref={resumeInputRef} accept=".pdf" className="hidden" onChange={handleResumeFileChange} />
      <input type="file" id="avatar-upload-input" ref={avatarInputRef} accept="image/*" className="hidden" onChange={handleAvatarFileChange} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <WorkspaceToolbar
          username={username}
          isHidden={profile.is_hidden}
          onToggleVisibility={handleToggleVisibility}
          onDownloadPdf={handleDownloadPdf}
        />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: 320px STICKY SIDEBAR (lg:col-span-4) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <ProfileHeaderCard
              profile={profile}
              avatarPreview={avatarPreview}
              isUploadingAvatar={isUploadingAvatar}
              onAvatarUploadClick={() => avatarInputRef.current?.click()}
            />
            <SkillsCard
              skills={skills}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
            />
            <LanguagesInterestsCard
              languages={profile.languages}
              interests={profile.interests}
            />
          </aside>

          {/* RIGHT COLUMN: MAIN STREAM (lg:col-span-8) */}
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
              onDeleteExperience={handleDeleteExperience}
              onReorderExperiences={handleReorderExperiences}
            />
            <EducationTimeline
              education={education}
              onAddEducation={handleAddEducation}
              onDeleteEducation={handleDeleteEducation}
            />
            <ResumeAttachmentCard
              resumeName={resumeName}
              isUploadingResume={isUploadingResume}
              onUploadClick={() => resumeInputRef.current?.click()}
              onDownloadPdf={handleDownloadPdf}
            />
          </main>
        </div>
      </div>

      {/* Video Playback Modal */}
      <VideoPitchModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        candidateName={profile.full_name}
        videoUrl={profile.video_pitch_url}
        posterUrl={profile.video_pitch_poster}
      />

      {/* Live WebRTC Studio Modal */}
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
