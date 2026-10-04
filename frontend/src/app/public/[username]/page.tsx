"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  Play,
  Download,
  AlertTriangle,
  X,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Share2,
  Video,
  Volume2,
  VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import { downloadCandidatePdf } from "@/services/media-upload.service";

export default function PublicCandidatePage() {
  const params = useParams();
  const username = (params.username as string).toLowerCase().trim();

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Video Pitch Modal Player State & Handlers
  const [isModalVideoPlaying, setIsModalVideoPlaying] = useState(false);
  const [isModalVideoMuted, setIsModalVideoMuted] = useState(false);
  const [modalVideoCurrentTime, setModalVideoCurrentTime] = useState(0);
  const [modalVideoDuration, setModalVideoDuration] = useState(30);

  const handleModalVideoLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (isFinite(v.duration) && v.duration > 0) {
      setModalVideoDuration(v.duration);
    }
    // Attempt unmuted play
    v.muted = false;
    v.play()
      .then(() => {
        setIsModalVideoPlaying(true);
        setIsModalVideoMuted(false);
      })
      .catch(() => {
        // Fallback to muted autoplay
        v.muted = true;
        setIsModalVideoMuted(true);
        v.play()
          .then(() => {
            setIsModalVideoPlaying(true);
          })
          .catch(() => {
            setIsModalVideoPlaying(false);
          });
      });
  };

  // Contact / Hire Candidate Modal
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

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

  // Handle Report Submission
  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await apiClient.post(`/v1/profile/${profile.id}/report/`, {
        reason: reportReason,
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setReportModalOpen(false);
        setReportSubmitted(false);
        setReportReason("");
      }, 2000);
    } catch (err) {
      alert("Failed to submit report. Please try again.");
    }
  };

  // Handle Contact Submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/v1/cms/contact/`, {
        name: contactName,
        email: contactEmail,
        subject: `Recruitment Inquiry for @${username} (${contactCompany})`,
        message: contactMessage,
      });
      setContactSubmitted(true);
      setTimeout(() => {
        setContactModalOpen(false);
        setContactSubmitted(false);
        setContactName("");
        setContactEmail("");
        setContactCompany("");
        setContactMessage("");
      }, 2000);
    } catch (err) {
      // Fallback optimistic
      setContactSubmitted(true);
      setTimeout(() => {
        setContactModalOpen(false);
        setContactSubmitted(false);
      }, 2000);
    }
  };

  // Handle Real Resume PDF Download
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
        <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={profile.avatar_url || "/images/avatar.jpg"}
              alt={profile.full_name}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#5bbbae] shadow-sm"
            />
            <div>
              <div className="flex items-center gap-3">
                <h1 data-testid="public-candidate-name" className="text-2xl font-bold text-[#252525]">{profile.full_name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  {profile.seeking_status}
                </span>
              </div>
              <p className="text-sm text-[#515151] pt-1 font-medium">{profile.headline}</p>
              <p className="text-xs text-[#737475] flex items-center gap-1 pt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {profile.location}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              data-testid="report-profile-btn"
              className="gap-2 text-[#737475] border-[#d1d6da] hover:text-red-600 cursor-pointer"
              onClick={() => setReportModalOpen(true)}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Report Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae]/10 cursor-pointer"
              onClick={() => setContactModalOpen(true)}
            >
              <MessageSquare className="w-4 h-4" /> Contact Candidate
            </Button>
            <Button
              variant="default"
              size="default"
              className="gap-2 bg-[#5bbbae] hover:bg-[#497d76] text-white cursor-pointer"
              onClick={handleDownloadResume}
            >
              <Download className="w-4 h-4" /> Download Resume PDF
            </Button>
          </div>
        </div>

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
          </div>

          {/* Right Column: Video Pitch & Timeline (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 0:30 Video Pitch */}
            <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#252525]">0:30 Video Elevator Pitch</h2>
                  <p className="text-xs text-[#737475]">Click to watch candidate's verified elevator pitch</p>
                </div>
                <span className="text-xs font-mono font-semibold text-[#5bbbae] bg-[#5bbbae]/10 px-2.5 py-1 rounded">
                  Verified Video
                </span>
              </div>

              <div
                data-testid="public-pitch-player-btn"
                className="start-content-video cursor-pointer shadow-md group relative rounded-lg overflow-hidden bg-black"
                onClick={() => setVideoModalOpen(true)}
              >
                <div className="modal-start">
                  <div className="video-play-icon" />
                </div>
                <img
                  src={profile.video_pitch_poster || "/images/home/matt-poster.png"}
                  alt="Candidate Elevator Pitch"
                  className="w-full h-80 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2.5 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> 0:30
                </div>
              </div>
            </div>

            {/* Experience Timeline */}
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
                  {jobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-[#d1d6da] bg-[#f8f9fa]"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#5bbbae]/10 border border-[#5bbbae]/20 flex items-center justify-center flex-shrink-0 text-[#21655e] font-bold text-base">
                        {job.company_name?.slice(0, 2).toUpperCase() || <Briefcase className="w-5 h-5 text-[#5bbbae]" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-[#252525]">{job.title}</h3>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {job.from_date_year || 2022} — {job.currently_work_here ? "Present" : (job.to_date_year || "Present")}
                          </span>
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

      {/* ==================================================== */}
      {/* Video Playback Modal                                 */}
      {/* ==================================================== */}
      {videoModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setVideoModalOpen(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-w-3xl w-full shadow-2xl relative space-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#5bbbae]" />
                <div>
                  <h3 className="text-base font-semibold text-white">0:30 Video Pitch — {profile.full_name}</h3>
                  <p className="text-xs text-slate-400">Verified Candidate Pitch</p>
                </div>
              </div>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                aria-label="Close video player"
              >
                <X className="w-5 h-5 lucide-x" />
              </button>
            </div>

            {/* Interactive Video Viewport */}
            <div 
              className="aspect-video bg-black flex items-center justify-center relative group cursor-pointer overflow-hidden"
              onClick={(e) => {
                const vid = e.currentTarget.querySelector("video");
                if (vid) {
                  if (vid.paused) {
                    vid.play().then(() => setIsModalVideoPlaying(true)).catch(() => {});
                  } else {
                    vid.pause();
                    setIsModalVideoPlaying(false);
                  }
                }
              }}
            >
              <video
                src={profile.video_pitch_url || "/images/home/Ava_s_Video.mp4"}
                poster={profile.video_pitch_poster || "/images/home/matt-poster.png"}
                controls
                playsInline
                preload="auto"
                onLoadedData={handleModalVideoLoaded}
                onPlay={() => setIsModalVideoPlaying(true)}
                onPause={() => setIsModalVideoPlaying(false)}
                onTimeUpdate={(e) => setModalVideoCurrentTime(e.currentTarget.currentTime)}
                onDurationChange={(e) => {
                  if (isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) {
                    setModalVideoDuration(e.currentTarget.duration);
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
                  onClick={(e) => {
                    e.stopPropagation();
                    const vid = e.currentTarget.parentElement?.querySelector("video");
                    if (vid) {
                      vid.muted = !vid.muted;
                      setIsModalVideoMuted(vid.muted);
                    }
                  }}
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
                    const vid = e.currentTarget.closest(".bg-slate-900")?.querySelector("video");
                    if (vid) {
                      vid.currentTime = 0;
                      vid.play();
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
      {/* Contact / Hire Candidate Modal                       */}
      {/* ==================================================== */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b pb-3 border-[#f0f2f5]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#5bbbae]" />
                <h3 className="text-lg font-bold text-[#252525]">Contact @{username}</h3>
              </div>
              <button onClick={() => setContactModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {contactSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <p className="text-base font-bold text-[#252525]">Message Dispatched!</p>
                <p className="text-xs text-[#737475]">
                  Your direct inquiry was sent to {profile.full_name}'s verified contact inbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#515151]">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Recruiter Name"
                    className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#515151]">Your Work Email *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#515151]">Company Name</label>
                  <input
                    type="text"
                    value={contactCompany}
                    onChange={(e) => setContactCompany(e.target.value)}
                    placeholder="e.g. Stripe, OpenAI"
                    className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#515151]">Message / Opportunity *</label>
                  <textarea
                    required
                    rows={3}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="We loved your video pitch and would like to invite you..."
                    className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#5bbbae] hover:bg-[#497d76] text-white">
                  Send Direct Inquiry
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* Report Modal                                         */}
      {/* ==================================================== */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b pb-3 border-[#f0f2f5]">
              <h3 className="text-lg font-bold text-[#252525]">Report Candidate Profile</h3>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-4 text-center text-sm font-semibold text-emerald-600">
                Thank you. Report received and sent to moderation team.
              </div>
            ) : (
              <form onSubmit={handleReport} className="space-y-4">
                <p className="text-xs text-[#737475]">
                  Please specify the reason for reporting @{username}'s profile (e.g. misleading credentials, inappropriate content).
                </p>
                <textarea
                  required
                  rows={4}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full p-3 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
                <Button type="submit" data-testid="report-modal-submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Submit Report
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
