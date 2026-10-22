"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Brain, Video, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import { TopCandidatesLeaderboard } from "@/components/features/search/top-candidates-leaderboard";

interface HomeTrendingData {
  total_searchable_profiles: number;
  video_verified_pct: number;
  trending_queries: Array<{ keyword: string; demand_growth: string }>;
}

const STEPS = [
  { Icon: Brain, title: "1. Prepare", desc: "Brainstorm key talking points for your 30-second introduction video, highlighting your education, career milestones, and unique superpowers." },
  { Icon: Video, title: "2. Record", desc: "Using your laptop webcam or smartphone camera, record your pitch inside our built-in video studio in as many takes as you desire." },
  { Icon: Wand2, title: "3. Get Creative", desc: "Complete your profile timeline, arrange your career experiences with interactive reordering, and share your public CV with potential employers." },
];

const SHOWCASE_CANDIDATES = [
  { username: "alexnguyen", name: "Jazmin Cole", role: "Senior Product Designer", img: "/images/home/Jazmin-1.jpg", alt: "Jazmin", modalTitle: "Jazmin — Elevator Pitch", videoUrl: "/images/home/Jazmin-Pitch.mp4" },
  { username: "alexnguyen", name: "Jeremy Tran", role: "Full-Stack Software Engineer", img: "/images/home/Jeremy-1.jpg", alt: "Jeremy", modalTitle: "Jeremy — Elevator Pitch", videoUrl: "/images/home/Jeremy-Pitch.mp4" },
  { username: "alexnguyen", name: "Rileigh Brooks", role: "Growth Marketing Manager", img: "/images/home/Rileigh-1.jpg", alt: "Rileigh", modalTitle: "Rileigh — Elevator Pitch", videoUrl: "/images/home/Rileigh-Pitch.mp4" },
];

const WALKTHROUGHS = [
  { title: "AVA'S PROFILE OVERVIEW", modalTitle: "Ava's Profile Overview", videoUrl: "/images/home/Ava_s_Video.mp4", img: "/images/home/Ana.png", desc: "Walk through Belooga's user-friendly video resume platform with Ava. See how seamlessly you can record, preview, and share your pitch with prospective employers in top tech companies.", cta: "Watch Walkthrough", reverse: false },
  { title: "INSPIRE YOUR RESUME", modalTitle: "Inspire Your Resume", videoUrl: "/images/home/Inspire_Your_Resume.mp4", img: "/images/home/Inspire.png", desc: "Regardless of your discipline, Belooga helps you articulate your personality and impact. Discover best practices for framing, audio, and storytelling in 30 seconds.", cta: "Watch Guide", reverse: true },
];

export default function HomePage() {
  const router = useRouter();
  const [searchKey, setSearchKey] = useState("");
  const [activeModal, setActiveModal] = useState<{ isOpen: boolean; title: string; videoUrl?: string }>({ isOpen: false, title: "" });

  const { data: pulse = null } = useQuery<HomeTrendingData | null>({
    queryKey: ["home-trending-pulse"],
    queryFn: async () => (await apiClient.get<HomeTrendingData>("/v1/profile/search/trending/")).data,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(searchKey.trim() ? `/search?key=${encodeURIComponent(searchKey.trim())}` : "/search");
  };

  const openVideo = (title: string, videoUrl: string) => setActiveModal({ isOpen: true, title, videoUrl });
  const closeModal = () => setActiveModal({ isOpen: false, title: "" });

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative overflow-hidden bg-slate-900 text-white min-h-[560px] flex items-center justify-center py-20">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/home/matt-poster.png"
            alt="Belooga candidate showcase background"
            width={1600}
            height={900}
            fetchPriority="high"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-slate-950/80" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h1 data-testid="home-hero-headline" className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight uppercase leading-tight">
              Reinventing the <span className="text-brand-primary">Candidate</span> Experience.
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
              Belooga is an interactive platform that pairs candidates&apos; resumes with an authentic 30-second video elevator pitch.
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex items-center bg-surface-card rounded-full p-2 shadow-2xl border border-white/20">
            <div className="flex items-center pl-4 pr-2 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              aria-label="Search candidates by skill, title, or name"
              data-testid="home-search-input"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder="Search Candidates by skill, title, or name..."
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm sm:text-base px-2"
            />
            <Button type="submit" size="default" data-testid="home-search-submit" className="rounded-full px-6 bg-brand-primary hover:bg-brand-hover text-white font-medium">
              Search
            </Button>
          </form>

          {pulse && (
            <div data-testid="home-market-pulse-ticker" className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-teal-300">{pulse.video_verified_pct}% Video-Verified Pool · Trending:</span>
              {pulse.trending_queries.slice(0, 4).map((t) => (
                <button
                  key={t.keyword}
                  type="button"
                  onClick={() => router.push(`/search?key=${encodeURIComponent(t.keyword)}`)}
                  className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-colors cursor-pointer"
                >
                  {t.keyword} <span className="text-emerald-400 font-bold">{t.demand_growth}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/search"><Button size="lg" className="bg-brand-primary hover:bg-brand-hover text-white px-8">Find Talent</Button></Link>
            <Link href="/register"><Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">Create Candidate Profile</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-surface-card border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-typography-main">How Belooga Works</h2>
            <p className="text-typography-body">A simple, structured three-step journey to elevate your professional profile.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-surface-page rounded-xl p-8 border border-surface-border shadow-sm text-center flex flex-col items-center space-y-4 hover:border-brand-primary transition-colors">
                <div className="w-16 h-16 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary"><Icon className="w-8 h-8" /></div>
                <h3 className="text-xl font-bold text-typography-main">{title}</h3>
                <p className="text-sm text-typography-body leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/register"><Button size="lg" className="bg-brand-primary hover:bg-brand-hover text-white px-10">Get Started Now</Button></Link>
          </div>
        </div>
      </section>


      <section className="py-20 bg-surface-page border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold text-typography-main">Platform Walkthroughs</h2>
            <p className="text-typography-body">See how our video resume platform revolutionizes the hiring workflow.</p>
          </div>

          {WALKTHROUGHS.map((w, idx) => (
            <div key={w.title} data-testid={idx === 0 ? "walkthrough-card" : undefined} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div
                className={`start-content-video cursor-pointer shadow-lg group relative ${w.reverse ? "order-1 lg:order-2" : ""}`}
                onClick={() => openVideo(w.modalTitle, w.videoUrl)}
              >
                <div className="modal-start"><div className="video-play-icon" /></div>
                <img src={w.img} alt={w.modalTitle} width={640} height={320} loading="lazy" className="w-full h-[320px] object-cover rounded-md" />
              </div>

              <div className={`space-y-4 ${w.reverse ? "order-2 lg:order-1" : ""}`}>
                <h3 className="text-2xl font-bold text-typography-main">{w.title}</h3>
                <p className="text-typography-body leading-relaxed">{w.desc}</p>
                <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary/10" onClick={() => openVideo(w.modalTitle, w.videoUrl)}>
                  {w.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10 bg-surface-page border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><TopCandidatesLeaderboard variant="spotlight" /></div>
      </section>

      <section className="py-20 bg-surface-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold text-typography-main">Real 30-Second Elevator Pitch Examples</h2>
            <p className="text-typography-body">Experience how authentic short video pitches make candidates stand out from the pile.</p>
          </div>

          <div data-testid="candidate-showcase-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SHOWCASE_CANDIDATES.map((c) => (
              <div
                key={c.name}
                className="bg-surface-page rounded-xl overflow-hidden border border-surface-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => openVideo(c.modalTitle, c.videoUrl)}
              >
                <div className="start-content-video relative">
                  <div className="modal-start"><div className="video-play-icon" /></div>
                  <img src={c.img} alt={c.alt} width={480} height={256} loading="lazy" className="w-full h-64 object-cover" />
                </div>
                <div className="p-6 text-center space-y-1">
                  <h3 data-testid="candidate-modal-link" className="text-xl font-bold text-typography-main group-hover:text-brand-primary transition-colors">{c.name}</h3>
                  <p className="text-sm text-typography-muted">{c.role}</p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <span className="text-xs text-brand-primary font-semibold">0:30 Video Pitch Ready</span>
                    <Link href={`/public/${c.username}`} onClick={(e) => e.stopPropagation()} className="text-xs font-semibold text-brand-primary hover:underline">
                      View Profile →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {activeModal.isOpen && (
        <div data-testid="walkthrough-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-w-3xl w-full shadow-2xl relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">{activeModal.title}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
              <video
                src={activeModal.videoUrl || "/images/home/Ava_s_Video.mp4"}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                data-testid="homepage-modal-video"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
