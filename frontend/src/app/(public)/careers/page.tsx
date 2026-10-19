"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";

interface CareerJobItem {
  id: string;
  title: string;
  department: string;
  location: string;
  description: string;
}

export default function CareersPage() {
  const { data: jobs = [] } = useQuery<CareerJobItem[]>({
    queryKey: ["career-jobs"],
    queryFn: async () => {
      const res = await apiClient.get<CareerJobItem[]>("/v1/career/jobs/");
      return res.data;
    },
  });

  return (
    <div className="min-h-screen bg-surface-page py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
            Join the Belooga Team
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-typography-main">
            Careers at Belooga
          </h1>
          <p className="text-sm text-typography-muted max-w-xl mx-auto">
            We're on a mission to modernize hiring through transparent video elevator pitches and authentic human connections.
          </p>
        </div>

        {/* Job Openings Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-typography-main">Open Positions</h2>
          
          <div data-testid="careers-openings-list" className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-brand-primary transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-typography-main">{job.title}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {job.department}
                    </span>
                  </div>
                  <p className="text-xs text-typography-muted flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {job.location}
                  </p>
                  <p className="text-xs text-typography-body leading-relaxed max-w-2xl">
                    {job.description}
                  </p>
                </div>

                <Button
                  data-testid="careers-apply-modal"
                  className="bg-brand-primary hover:bg-brand-hover text-white flex-shrink-0"
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
