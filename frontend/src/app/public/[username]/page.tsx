"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import { downloadCandidatePdf } from "@/services/media-upload.service";
import { PublicHeaderCard } from "@/components/features/profile/public-header-card";
import { PublicContactModal } from "@/components/features/profile/public-contact-modal";
import { ReportProfileModal } from "@/components/features/profile/report-profile-modal";
import { VideoPitchCard } from "@/components/features/media/video-pitch-card";
import { VideoPitchModal } from "@/components/features/media/video-pitch-modal";
import { TimelineItemCard } from "@/components/features/timeline/timeline-item-card";

export default function PublicCandidatePage() {
  const params = useParams();
  const username = (params.username as string).toLowerCase().trim();

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.get(`/v1/profile/${username}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Candidate not found", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (username) load();
  }, [username]);

  const handleDownloadResume = () => {
    downloadCandidatePdf(username);
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
        <p className="text-sm text-[#737475]">The profile @{username} does not exist or has been removed.</p>
        <Link href="/search">
          <Button variant="default">Browse Other Candidates</Button>
        </Link>
      </div>
    );
  }

  const jobs = profile.job_experiences || [];
  const education = profile.education_experiences || [];
  const skills = profile.skills || [];

  return (
    <div data-testid="public-profile-container" className="min-h-screen bg-[#f8f9fa] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Public Header Card */}
        <PublicHeaderCard
          fullName={profile.full_name}
          avatarUrl={profile.avatar_url}
          seekingStatus={profile.seeking_status}
          headline={profile.headline}
          location={profile.location}
          onReportClick={() => setReportModalOpen(true)}
          onContactClick={() => setContactModalOpen(true)}
          onDownloadResume={handleDownloadResume}
        />

        {/* 2-Column Public CV Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Bio & Credentials (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Bio Card */}
            <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#252525]">
                Candidate Bio
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                {profile.bio}
              </p>

              {(profile.email || profile.phone) && (
                <div className="pt-4 border-t border-[#f0f2f5] space-y-2 text-xs text-[#515151]">
                  {profile.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Skills & Strengths */}
            <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#252525]">
                Skills & Strengths
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((s: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-[#f8f9fa] border border-[#d1d6da] rounded-md text-xs font-medium text-[#515151]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages & Interests */}
            {(profile.languages?.length > 0 || profile.interests?.length > 0) && (
              <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#252525]">
                  Languages & Interests
                </h3>
                {profile.languages?.length > 0 && (
                  <div className="space-y-2 text-xs">
                    {profile.languages.map((lang: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-[#515151]">
                        <span className="font-medium">{lang.name}</span>
                        <span className="text-slate-400">{lang.proficiency}</span>
                      </div>
                    ))}
                  </div>
                )}
                {profile.interests?.length > 0 && (
                  <div className="pt-2 border-t border-[#f0f2f5] flex flex-wrap gap-1.5">
                    {profile.interests.map((interest: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600"
                      >
                        #{interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Video Pitch & Timeline (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 0:30 Video Pitch reusing VideoPitchCard */}
            <VideoPitchCard
              posterUrl={profile.video_pitch_poster}
              onPlayClick={() => setVideoModalOpen(true)}
              isEditable={false}
              testId="public-pitch-player-btn"
              badgeText="Verified Video"
              subtitle="Click to watch candidate's verified elevator pitch"
            />

            {/* Experience Timeline reusing TimelineItemCard */}
            <div data-testid="public-timeline-section" className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#5bbbae]" />
                <h2 className="text-lg font-bold text-[#252525]">Work Experience</h2>
              </div>

              {jobs.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#d1d6da] rounded-lg text-slate-400 text-sm">
                  Candidate has not listed any prior work experience yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job: any, idx: number) => (
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

            {/* Education History */}
            <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#5bbbae]" />
                <h2 className="text-lg font-bold text-[#252525]">Education</h2>
              </div>

              {education.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#d1d6da] rounded-lg text-slate-400 text-sm">
                  Candidate has not listed any education credentials yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {education.map((edu: any) => (
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
                          <span className="text-xs text-slate-400">
                            {edu.from_date_year || 2018} — {edu.to_date_year || 2022}
                          </span>
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
          </div>
        </div>
      </div>

      {/* Video Playback Modal reusing VideoPitchModal */}
      <VideoPitchModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        candidateName={profile.full_name}
        videoUrl={profile.video_pitch_url}
        posterUrl={profile.video_pitch_poster}
      />

      {/* Contact Modal */}
      <PublicContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        username={username}
        fullName={profile.full_name}
      />

      {/* Report Modal */}
      <ReportProfileModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        candidateId={profile.id}
        username={username}
      />
    </div>
  );
}
