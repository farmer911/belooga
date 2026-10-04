"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";

export default function CareersPage() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await apiClient.get("/v1/career/jobs/");
        setJobs(res.data);
      } catch (err) {
        console.error("Failed to load jobs", err);
      }
    }
    loadJobs();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#5bbbae] bg-[#5bbbae]/10 px-3 py-1 rounded-full">
            Join the Belooga Team
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#252525]">
            Careers at Belooga
          </h1>
          <p className="text-sm text-[#737475] max-w-xl mx-auto">
            We're on a mission to modernize hiring through transparent video elevator pitches and authentic human connections.
          </p>
        </div>

        {/* Job Openings Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#252525]">Open Positions</h2>
          
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-[#5bbbae] transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-[#252525]">{job.title}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {job.department}
                    </span>
                  </div>
                  <p className="text-xs text-[#737475] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {job.location}
                  </p>
                  <p className="text-xs text-[#666666] leading-relaxed max-w-2xl">
                    {job.description}
                  </p>
                </div>

                <Button
                  className="bg-[#5bbbae] hover:bg-[#497d76] text-white flex-shrink-0"
                  onClick={() => alert(`Applying for ${job.title} — Application submission modal opens.`)}
                >
                  Apply Now <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
