"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Briefcase, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import { downloadCandidatePdf } from "@/services/media-upload.service";
import { CandidateProfile, JobExperience } from "@/hooks/use-candidate-profile";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { PublicHeaderCard } from "@/components/features/profile/public-header-card";
import { PublicContactModal } from "@/components/features/profile/public-contact-modal";
import { ReportProfileModal } from "@/components/features/profile/report-profile-modal";
import { LanguagesInterestsCard } from "@/components/features/profile/languages-interests-card";
import { VideoPitchCard } from "@/components/features/media/video-pitch-card";
import { VideoPitchModal } from "@/components/features/media/video-pitch-modal";
import { TimelineItemCard } from "@/components/features/timeline/timeline-item-card";
import { EducationTimeline } from "@/components/features/timeline/education-timeline";
import { AwardsTimeline } from "@/components/features/timeline/awards-timeline";

interface TrustScoreResponse {
  username: string; trust_score: number; readiness_tier: string; recruiter_conversion_multiplier: number;
  pillars: Array<{ pillar: string; score: number; max_score: number; status: string; detail: string }>; next_boost_action: string;
}
interface CareerTrajectoryResponse {
  username: string; current_inferred_level: string; next_target_level: string; promotion_readiness_pct: number; trajectory_velocity: string;
}

export default function PublicCandidatePage() {
  const params = useParams();
  const username = (params.username as string).toLowerCase().trim();

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { isBookmarked, isPendingFor, toggleBookmark } = useBookmarks();

  const { data: dossier, isLoading } = useQuery({
    queryKey: ["public-candidate-dossier-rpc", username],
    queryFn: async () => {
      const { data } = await apiClient.post<{ results: Array<{ id: string; status: number; data?: unknown }> }>("/v1/rpc/batch", {
        calls: [
          { id: "prof", method: "profile.get", params: { username } },
          { id: "trust", method: "profile.trustScore", params: { username } },
          { id: "traj", method: "profile.trajectory", params: { username } },
        ],
      });
      const map = Object.fromEntries((data.results || []).map((r) => [r.id, r]));
      if (map.prof?.status !== 200) throw new Error("Candidate not found");
      return {
        profile: (map.prof.data as CandidateProfile) || null,
        trustData: map.trust?.status === 200 ? (map.trust.data as TrustScoreResponse) : null,
        trajectory: map.traj?.status === 200 ? (map.traj.data as CareerTrajectoryResponse) : null,
      };
    },
    enabled: Boolean(username),
  });
  const profile = dossier?.profile ?? null;
  const trustData = dossier?.trustData ?? null;
  const trajectory = dossier?.trajectory ?? null;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-typography-main">Candidate Profile Not Found</h2>
        <p className="text-sm text-typography-muted">The profile @{username} does not exist or has been removed.</p>
        <Link href="/search"><Button variant="default">Browse Other Candidates</Button></Link>
      </div>
    );
  }

  const jobs: JobExperience[] = profile.job_experiences || [];
  const education = profile.education_experiences || [];
  const skills: string[] = profile.skills || [];

  return (
    <div data-testid="public-profile-container" className="min-h-screen bg-surface-page py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <PublicHeaderCard
          fullName={profile.full_name}
          avatarUrl={profile.avatar_url}
          seekingStatus={profile.seeking_status}
          headline={profile.headline}
          location={profile.location}
          isBookmarked={isBookmarked(username)}
          isBookmarkPending={isPendingFor(username)}
          onBookmarkToggle={() => toggleBookmark(username)}
          onReportClick={() => setReportModalOpen(true)}
          onContactClick={() => setContactModalOpen(true)}
          onDownloadResume={() => downloadCandidatePdf(username)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            {trustData && (
              <div data-testid="profile-trust-score-card" className="bg-surface-card rounded-xl border border-surface-border p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-typography-main">{trustData.readiness_tier}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                    {trustData.trust_score}/100 Trust
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {trustData.pillars.map((p) => (
                    <div key={p.pillar} className="bg-surface-page rounded-lg p-2 border border-surface-border">
                      <p className="text-[10px] font-semibold text-typography-muted truncate">{p.pillar}</p>
                      <p className="text-xs font-bold text-typography-main">{p.score}/{p.max_score} · {p.status}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold">{trustData.recruiter_conversion_multiplier}x Shortlist Conversion Index</p>
              </div>
            )}

            <div className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-typography-main">Candidate Bio</h3>
              <p className="text-xs text-typography-body leading-relaxed">{profile.bio}</p>
              {(profile.email || profile.phone) && (
                <div className="pt-4 border-t border-surface-divider space-y-2 text-xs text-typography-heading">
                  {profile.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-typography-muted" /><span>{profile.email}</span></div>}
                  {profile.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-typography-muted" /><span>{profile.phone}</span></div>}
                </div>
              )}
            </div>

            <div className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-typography-main">Skills & Strengths</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-surface-page border border-surface-border rounded-md text-xs font-medium text-typography-heading">{s}</span>
                ))}
              </div>
            </div>

            <LanguagesInterestsCard languages={profile.languages} interests={profile.interests} />
          </div>

          <div className="lg:col-span-8 space-y-8">
            <VideoPitchCard
              posterUrl={profile.video_pitch_poster}
              onPlayClick={() => setVideoModalOpen(true)}
              isEditable={false}
              testId="public-pitch-player-btn"
              badgeText="Verified Video"
              subtitle="Click to watch candidate's verified elevator pitch"
            />

            <div data-testid="public-timeline-section" className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-brand-primary" />
                  <h2 className="text-lg font-bold text-typography-main">Work Experience</h2>
                </div>
                {trajectory && (
                  <span data-testid="career-trajectory-badge" className="px-2.5 py-1 rounded-full bg-brand-overlay border border-brand-primary/30 text-[11px] font-bold text-brand-dark">
                    {trajectory.current_inferred_level} → {trajectory.next_target_level} ({trajectory.promotion_readiness_pct}% Ready)
                  </span>
                )}
              </div>

              {jobs.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-surface-border rounded-lg text-typography-muted text-sm">
                  Candidate has not listed any prior work experience yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job, idx) => (
                    <TimelineItemCard
                      key={job.id || idx}
                      id={job.id}
                      index={idx}
                      title={job.title}
                      companyName={job.company_name}
                      fromYear={job.from_date_year}
                      toYear={job.to_date_year}
                      currentlyWorkHere={job.currently_work_here}
                      description={job.description}
                      isDraggable={false}
                      isEditable={false}
                    />
                  ))}
                </div>
              )}
            </div>

            <EducationTimeline education={education} isEditable={false} />
            <AwardsTimeline username={username} isEditable={false} />
          </div>
        </div>
      </div>

      <VideoPitchModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} candidateName={profile.full_name} videoUrl={profile.video_pitch_url} posterUrl={profile.video_pitch_poster} />
      <PublicContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} username={username} fullName={profile.full_name} />
      <ReportProfileModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} candidateId={String(profile.user_id || profile.id || username)} username={username} />
    </div>
  );
}
