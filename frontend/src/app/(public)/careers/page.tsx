"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
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
  const [activeJob, setActiveJob] = useState<CareerJobItem | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [pitchNote, setPitchNote] = useState("");
  const [submittedJobId, setSubmittedJobId] = useState<string | null>(null);

  const { data: jobs = [] } = useQuery<CareerJobItem[]>({
    queryKey: ["career-jobs"],
    queryFn: async () => {
      const res = await apiClient.get<CareerJobItem[]>("/v1/career/jobs/");
      return res.data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (job: CareerJobItem) => {
      const res = await apiClient.post(`/v1/career/jobs/${job.id}/apply/`, {
        applicant_name: applicantName.trim() || "Belooga Candidate",
        applicant_email: applicantEmail.trim() || "candidate@belooga.com",
        resume_url: pitchNote.trim() || "/uploads/resumes/belooga_pitch_profile.pdf",
      });
      return res.data;
    },
    onSuccess: (_data, job) => {
      setSubmittedJobId(job.id);
      setActiveJob(null);
      setPitchNote("");
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-typography-main">Open Positions</h2>
            <Link
              href="/ats-diagnostics"
              data-testid="careers-ats-check-link"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" /> Test Your Resume ATS Match Before Applying
            </Link>
          </div>

          <div data-testid="careers-openings-list" className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm space-y-4 hover:border-brand-primary transition-colors"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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

                  {submittedJobId === job.id ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" /> Application Received
                    </span>
                  ) : (
                    <Button
                      data-testid="careers-apply-modal"
                      className="bg-brand-primary hover:bg-brand-hover text-white flex-shrink-0"
                      onClick={() => setActiveJob(activeJob?.id === job.id ? null : job)}
                    >
                      Apply Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>

                {activeJob?.id === job.id && (
                  <div className="pt-4 border-t border-surface-border grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="rounded-lg border border-surface-border px-3 py-2 text-xs"
                    />
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      className="rounded-lg border border-surface-border px-3 py-2 text-xs"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Belooga @username or video pitch note"
                        value={pitchNote}
                        onChange={(e) => setPitchNote(e.target.value)}
                        className="flex-1 rounded-lg border border-surface-border px-3 py-2 text-xs"
                      />
                      <Button
                        size="sm"
                        disabled={applyMutation.isPending}
                        onClick={() => applyMutation.mutate(job)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0"
                      >
                        {applyMutation.isPending ? "Sending..." : "Submit"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
