"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Brain, Video, Wand2, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const [searchKey, setSearchKey] = useState("");
  const [activeModal, setActiveModal] = useState<{
    isOpen: boolean;
    title: string;
    videoUrl?: string;
  }>({
    isOpen: false,
    title: "",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKey.trim()) {
      router.push(`/search?key=${encodeURIComponent(searchKey.trim())}`);
    } else {
      router.push("/search");
    }
  };

  const openVideo = (title: string, videoUrl: string) => {
    setActiveModal({ isOpen: true, title, videoUrl });
  };

  const closeModal = () => {
    setActiveModal({ isOpen: false, title: "" });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden bg-slate-900 text-white min-h-[560px] flex items-center justify-center py-20">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/home/matt-poster.png"
            alt="Belooga candidate showcase background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-slate-950/80" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h1 data-testid="home-hero-headline" className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight uppercase leading-tight">
              Reinventing the <span className="text-[#5bbbae]">Candidate</span> Experience.
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
              Belooga is an interactive platform that pairs candidates' resumes with an authentic 30-second video elevator pitch.
            </p>
          </div>

          {/* Search Bar Form */}
          <form
            onSubmit={handleSearch}
            className="max-w-xl mx-auto flex items-center bg-white rounded-full p-2 shadow-2xl border border-white/20"
          >
            <div className="flex items-center pl-4 pr-2 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              data-testid="home-search-input"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder="Search Candidates by skill, title, or name..."
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm sm:text-base px-2"
            />
            <Button
              type="submit"
              size="default"
              data-testid="home-search-submit"
              className="rounded-full px-6 bg-[#5bbbae] hover:bg-[#497d76] text-white font-medium"
            >
              Search
            </Button>
          </form>

          {/* Dual CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/search">
              <Button size="lg" className="bg-[#5bbbae] hover:bg-[#497d76] text-white px-8">
                Find Talent
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8"
              >
                Create Candidate Profile
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. THREE-STEP HIRING PROCESS                             */}
      {/* ======================================================== */}
      <section className="py-20 bg-white border-b border-[#d1d6da]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-[#252525]">
              How Belooga Works
            </h2>
            <p className="text-[#666666]">
              A simple, structured three-step journey to elevate your professional profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Prepare */}
            <div className="bg-[#f8f9fa] rounded-xl p-8 border border-[#d1d6da] shadow-sm text-center flex flex-col items-center space-y-4 hover:border-[#5bbbae] transition-colors">
              <div className="w-16 h-16 rounded-full bg-[#5bbbae]/15 flex items-center justify-center text-[#5bbbae]">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#252525]">1. Prepare</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                Brainstorm key talking points for your 30-second introduction video, highlighting your education, career milestones, and unique superpowers.
              </p>
            </div>

            {/* Step 2: Record */}
            <div className="bg-[#f8f9fa] rounded-xl p-8 border border-[#d1d6da] shadow-sm text-center flex flex-col items-center space-y-4 hover:border-[#5bbbae] transition-colors">
              <div className="w-16 h-16 rounded-full bg-[#5bbbae]/15 flex items-center justify-center text-[#5bbbae]">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#252525]">2. Record</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                Using your laptop webcam or smartphone camera, record your pitch inside our built-in video studio in as many takes as you desire.
              </p>
            </div>

            {/* Step 3: Get Creative */}
            <div className="bg-[#f8f9fa] rounded-xl p-8 border border-[#d1d6da] shadow-sm text-center flex flex-col items-center space-y-4 hover:border-[#5bbbae] transition-colors">
              <div className="w-16 h-16 rounded-full bg-[#5bbbae]/15 flex items-center justify-center text-[#5bbbae]">
                <Wand2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#252525]">3. Get Creative</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                Complete your profile timeline, arrange your career experiences with interactive reordering, and share your public CV with potential employers.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/register">
              <Button size="lg" className="bg-[#5bbbae] hover:bg-[#497d76] text-white px-10">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. VIDEO WALKTHROUGHS SECTION (Strict 54px Play Button)   */}
      {/* ======================================================== */}
      <section className="py-20 bg-[#f8f9fa] border-b border-[#d1d6da]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold text-[#252525]">
              Platform Walkthroughs
            </h2>
            <p className="text-[#666666]">
              See how our video resume platform revolutionizes the hiring workflow.
            </p>
          </div>

          {/* Walkthrough 1: Ava's Profile Overview */}
          <div data-testid="walkthrough-card" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Video Thumbnail with Hover Overlay & 54px Play Button */}
            <div
              className="start-content-video cursor-pointer shadow-lg group relative"
              onClick={() => openVideo("Ava's Profile Overview", "/images/home/Ava_s_Video.mp4")}
            >
              <div className="modal-start">
                <div className="video-play-icon" />
              </div>
              <img
                src="/images/home/Ana.png"
                alt="Ava's Profile Overview"
                className="w-full h-[320px] object-cover rounded-md"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-[#252525]">
                AVA'S PROFILE OVERVIEW
              </h3>
              <p className="text-[#666666] leading-relaxed">
                Walk through Belooga's user-friendly video resume platform with Ava. See how seamlessly you can record, preview, and share your pitch with prospective employers in top tech companies.
              </p>
              <Button
                variant="outline"
                className="border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae]/10"
                onClick={() => openVideo("Ava's Profile Overview", "/images/home/Ava_s_Video.mp4")}
              >
                Watch Walkthrough
              </Button>
            </div>
          </div>

          {/* Walkthrough 2: Inspire Your Resume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4 order-2 lg:order-1">
              <h3 className="text-2xl font-bold text-[#252525]">
                INSPIRE YOUR RESUME
              </h3>
              <p className="text-[#666666] leading-relaxed">
                Regardless of your discipline, Belooga helps you articulate your personality and impact. Discover best practices for framing, audio, and storytelling in 30 seconds.
              </p>
              <Button
                variant="outline"
                className="border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae]/10"
                onClick={() => openVideo("Inspire Your Resume", "/images/home/Inspire_Your_Resume.mp4")}
              >
                Watch Guide
              </Button>
            </div>

            <div
              className="start-content-video cursor-pointer shadow-lg group relative order-1 lg:order-2"
              onClick={() => openVideo("Inspire Your Resume", "/images/home/Inspire_Your_Resume.mp4")}
            >
              <div className="modal-start">
                <div className="video-play-icon" />
              </div>
              <img
                src="/images/home/Inspire.png"
                alt="Inspire Your Resume"
                className="w-full h-[320px] object-cover rounded-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. 30-SECOND ELEVATOR PITCH CANDIDATE SHOWCASE            */}
      {/* ======================================================== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold text-[#252525]">
              Real 30-Second Elevator Pitch Examples
            </h2>
            <p className="text-[#666666]">
              Experience how authentic short video pitches make candidates stand out from the pile.
            </p>
          </div>

          <div data-testid="candidate-showcase-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Candidate 1: Jazmin */}
            <div
              className="bg-[#f8f9fa] rounded-xl overflow-hidden border border-[#d1d6da] shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => openVideo("Jazmin — Elevator Pitch", "/images/home/Jazmin-Pitch.mp4")}
            >
              <div className="start-content-video relative">
                <div className="modal-start">
                  <div className="video-play-icon" />
                </div>
                <img
                  src="/images/home/Jazmin-1.jpg"
                  alt="Jazmin"
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="p-6 text-center space-y-1">
                <h3 className="text-xl font-bold text-[#252525] group-hover:text-[#5bbbae] transition-colors">
                  Jazmin Cole
                </h3>
                <p className="text-sm text-[#737475]">Senior Product Designer</p>
                <p className="text-xs text-[#5bbbae] font-semibold pt-2">0:30 Video Pitch Ready</p>
              </div>
            </div>

            {/* Candidate 2: Jeremy */}
            <div
              className="bg-[#f8f9fa] rounded-xl overflow-hidden border border-[#d1d6da] shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => openVideo("Jeremy — Elevator Pitch", "/images/home/Jeremy-Pitch.mp4")}
            >
              <div className="start-content-video relative">
                <div className="modal-start">
                  <div className="video-play-icon" />
                </div>
                <img
                  src="/images/home/Jeremy-1.jpg"
                  alt="Jeremy"
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="p-6 text-center space-y-1">
                <h3 className="text-xl font-bold text-[#252525] group-hover:text-[#5bbbae] transition-colors">
                  Jeremy Tran
                </h3>
                <p className="text-sm text-[#737475]">Full-Stack Software Engineer</p>
                <p className="text-xs text-[#5bbbae] font-semibold pt-2">0:30 Video Pitch Ready</p>
              </div>
            </div>

            {/* Candidate 3: Rileigh */}
            <div
              className="bg-[#f8f9fa] rounded-xl overflow-hidden border border-[#d1d6da] shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => openVideo("Rileigh — Elevator Pitch", "/images/home/Rileigh-Pitch.mp4")}
            >
              <div className="start-content-video relative">
                <div className="modal-start">
                  <div className="video-play-icon" />
                </div>
                <img
                  src="/images/home/Rileigh-1.jpg"
                  alt="Rileigh"
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="p-6 text-center space-y-1">
                <h3 className="text-xl font-bold text-[#252525] group-hover:text-[#5bbbae] transition-colors">
                  Rileigh Brooks
                </h3>
                <p className="text-sm text-[#737475]">Growth Marketing Manager</p>
                <p className="text-xs text-[#5bbbae] font-semibold pt-2">0:30 Video Pitch Ready</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* VIDEO POPUP MODAL                                        */}
      {/* ======================================================== */}
      {activeModal.isOpen && (
        <div data-testid="walkthrough-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-w-3xl w-full shadow-2xl relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">{activeModal.title}</h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#5bbbae]/20 text-[#5bbbae] flex items-center justify-center mx-auto">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
                <p className="text-white text-base font-medium">{activeModal.title}</p>
                <p className="text-slate-400 text-xs">Simulated HTML5 0:30 Video Elevator Pitch Playback</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
