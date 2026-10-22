"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, ArrowRight, Sparkles, CheckCircle2, Building2, PlusCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/store/auth-store";
import { PostCareerModal, CareerJobItem } from "@/components/features/careers/post-career-modal";

export default function CareersPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [activeJob, setActiveJob] = useState<CareerJobItem | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [pitchNote, setPitchNote] = useState("");
  const [submittedJobIds, setSubmittedJobIds] = useState<Record<string, boolean>>({});

  const { data: apiJobs = [] } = useQuery<CareerJobItem[]>({
    queryKey: ["career-jobs"],
    queryFn: async () => {
      const res = await apiClient.get<CareerJobItem[]>("/v1/career/jobs/");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const allJobs = useMemo(
    () => apiJobs.map((j) => ({ ...j, company_name: j.company_name || "Belooga" })),
    [apiJobs]
  );

  const companies = useMemo(
    () => ["ALL", ...Array.from(new Set(allJobs.map((j) => j.company_name || "Belooga")))],
    [allJobs]
  );
  const visibleJobs = useMemo(
    () => allJobs.filter((j) => (companyFilter === "ALL" ? true : (j.company_name || "Belooga") === companyFilter)),
    [allJobs, companyFilter]
  );

  const createCareerMutation = useMutation({
    mutationFn: async (payload: Omit<CareerJobItem, "id">) => {
      const res = await apiClient.post<CareerJobItem>("/v1/careers/", payload);
      return res.data;
    },
    onSuccess: (created) => {
      if (created) {
        queryClient.setQueryData<CareerJobItem[]>(["career-jobs"], (prev = []) => [created, ...prev]);
      }
      void queryClient.invalidateQueries({ queryKey: ["career-jobs"] });
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (job: CareerJobItem) => {
      const authFullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
      const applyPayload = {
        applicant_name: applicantName.trim() || authFullName || "Candidate Applicant",
        applicant_email: applicantEmail.trim() || user?.email || "candidate@belooga.com",
        resume_url: pitchNote.trim() || "/uploads/resumes/belooga_pitch_profile.pdf",
      };
      await apiClient.post(`/v1/career/jobs/${job.id}/apply/`, applyPayload);
      return job.id;
    },
    onSuccess: (jobId) => {
      setSubmittedJobIds((prev) => ({ ...prev, [jobId]: true }));
      setActiveJob(null);
      setPitchNote("");
      void queryClient.invalidateQueries({ queryKey: ["job-tracker-items"] });
    },
  });

  return (
    <div className="min-h-screen bg-surface-page py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
            Multi-Company Talent Marketplace & Career Board
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-typography-main">Careers at Belooga</h1>
          <p className="text-sm text-typography-muted max-w-2xl mx-auto">
            Khám phá cơ hội nghề nghiệp tại Belooga và các công ty công nghệ đối tác, hoặc đăng tin tuyển dụng cho doanh nghiệp của bạn.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button type="button" data-testid="btn-open-post-career-modal" onClick={() => setPostModalOpen(true)} className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold gap-1.5">
              <PlusCircle className="w-4 h-4" /> Đăng Tin Tuyển Dụng Cho Công Ty Của Bạn
            </Button>
            <Link href="/ats-diagnostics" data-testid="careers-ats-check-link" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-border bg-surface-card text-xs font-bold text-brand-primary hover:border-brand-primary">
              <Sparkles className="w-3.5 h-3.5" /> Test Your Resume ATS Match Before Applying
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-3">
            <h2 className="text-xl font-bold text-typography-main">Open Positions ({visibleJobs.length})</h2>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {companies.map((comp) => (
                <button key={comp} type="button" data-testid={`career-filter-company-${comp}`} onClick={() => setCompanyFilter(comp)} className={`px-2.5 py-1 rounded-md border font-semibold transition-colors cursor-pointer ${companyFilter === comp ? "bg-brand-primary text-white border-brand-primary" : "bg-surface-card text-typography-heading border-surface-border hover:border-brand-primary"}`}>
                  {comp === "ALL" ? "Tất cả công ty" : comp}
                </button>
              ))}
            </div>
          </div>

          <div data-testid="careers-openings-list" className="space-y-4">
            {visibleJobs.map((job) => {
              const isApplied = Boolean(submittedJobIds[job.id]);
              const isExternal = job.is_partner || (job.company_name && job.company_name !== "Belooga");
              return (
                <div key={job.id} data-testid={`career-job-card-${job.id}`} className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-xs space-y-4 hover:border-brand-primary transition-colors">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={isExternal ? "teal" : "outline"} className="text-[10px] gap-1"><Building2 className="w-3 h-3" /> {job.company_name || "Belooga"}</Badge>
                        <h3 className="text-lg font-bold text-typography-main">{job.title}</h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-surface-page border border-surface-border text-typography-heading">{job.department}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-typography-muted">
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-brand-primary" /> {job.location}</span>
                        {job.salary_range && <span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><DollarSign className="w-3.5 h-3.5" /> {job.salary_range}</span>}
                      </div>
                      <p className="text-xs text-typography-body leading-relaxed max-w-2xl">{job.description}</p>
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.skills.map((sk) => <span key={sk} className="px-2 py-0.5 rounded bg-surface-page border border-surface-border text-[10px] font-semibold text-brand-dark">{sk}</span>)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link href="/ats-diagnostics">
                        <Button variant="outline" size="sm" className="text-xs border-surface-border gap-1"><Sparkles className="w-3.5 h-3.5 text-brand-primary" /> Quét ATS</Button>
                      </Link>
                      {isApplied ? (
                        <span data-testid={`career-applied-badge-${job.id}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" /> Application Received
                        </span>
                      ) : (
                        <Button data-testid="careers-apply-modal" className="bg-brand-primary hover:bg-brand-hover text-white shrink-0 text-xs" onClick={() => setActiveJob(activeJob?.id === job.id ? null : job)}>
                          Apply Now <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {activeJob?.id === job.id && (
                    <div className="pt-4 border-t border-surface-border grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <input type="text" placeholder="Your Full Name" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} className="rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-xs" />
                      <input type="email" placeholder="you@company.com" value={applicantEmail} onChange={(e) => setApplicantEmail(e.target.value)} className="rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-xs" />
                      <div className="flex gap-2">
                        <input type="text" placeholder="Belooga @username or video pitch note" value={pitchNote} onChange={(e) => setPitchNote(e.target.value)} className="flex-1 rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-xs" />
                        <Button size="sm" data-testid={`career-1click-apply-submit-${job.id}`} disabled={applyMutation.isPending} onClick={() => applyMutation.mutate(job)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0">
                          {applyMutation.isPending ? "Sending..." : "Submit"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <PostCareerModal open={postModalOpen} onClose={() => setPostModalOpen(false)} onCreateJob={async (payload) => { await createCareerMutation.mutateAsync(payload); }} isSubmitting={createCareerMutation.isPending} />
    </div>
  );
}
