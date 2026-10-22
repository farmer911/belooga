"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { apiClient } from "@/services/api-client";
import { JobExperience } from "@/hooks/use-candidate-profile";
import { useTimelineDnD } from "@/hooks/use-timeline-dnd";
import { TimelineItemCard } from "./timeline-item-card";

export interface ExperienceTimelineProps {
  experiences: JobExperience[];
  onAddExperience?: (payload: Omit<JobExperience, "id">) => Promise<unknown>;
  onUpdateExperience?: (id: string, payload: Partial<JobExperience>) => Promise<void> | void;
  onUpdate?: (id: string, payload: Partial<JobExperience>) => Promise<void> | void;
  onDeleteExperience?: (id: string) => Promise<void> | void;
  onReorderExperiences?: (items: JobExperience[]) => Promise<void> | void;
  isEditable?: boolean;
}

export function ExperienceTimeline({
  experiences,
  onAddExperience,
  onUpdateExperience,
  onUpdate,
  onDeleteExperience,
  onReorderExperiences,
  isEditable = true,
}: ExperienceTimelineProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("/images/logo-big.png");
  const [fromYear, setFromYear] = React.useState(2022);
  const [currentlyWork, setCurrentlyWork] = React.useState(false);
  const [toYear, setToYear] = React.useState(2024);
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { data: companySuggestions = [] } = useQuery<Array<{ name: string; logo_url?: string }>>({
    queryKey: ["catalog-companies", company],
    queryFn: async () =>
      (await apiClient.get<Array<{ name: string; logo_url?: string }>>(`/v1/profile/company/?name=${encodeURIComponent(company)}`)).data,
    enabled: modalOpen,
  });

  const { draggedIndex, dragOverIndex, handleDragStart, handleDragOver, handleDrop } = useTimelineDnD({
    items: experiences,
    onReorder: onReorderExperiences || (() => {}),
  });

  const openAddModal = () => {
    setEditingId(null);
    setTitle(""); setCompany(""); setLogoUrl("/images/logo-big.png");
    setFromYear(2022); setCurrentlyWork(false); setToYear(2024); setDescription("");
    setErrorMsg(null); setModalOpen(true);
  };

  const openEditModal = (job: JobExperience) => {
    setEditingId(job.id);
    setTitle(job.title); setCompany(job.company_name); setLogoUrl(job.logo_url || "/images/logo-big.png");
    setFromYear(job.from_date_year || 2022); setCurrentlyWork(Boolean(job.currently_work_here));
    setToYear(job.to_date_year || 2024); setDescription(job.description || "");
    setErrorMsg(null); setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    const matchedCompany = companySuggestions.find((c) => c.name.toLowerCase() === company.trim().toLowerCase());
    const payload = {
      title,
      company_name: company,
      from_date_year: Number(fromYear),
      from_date_month: 1,
      currently_work_here: currentlyWork,
      to_date_year: currentlyWork ? null : Number(toYear),
      to_date_month: currentlyWork ? null : 12,
      description,
      logo_url: matchedCompany?.logo_url || logoUrl || "/images/logo-big.png",
    };
    try {
      const updater = onUpdateExperience || onUpdate;
      if (editingId && updater) {
        await updater(editingId, payload);
      } else if (onAddExperience) {
        await onAddExperience(payload);
      }
      setModalOpen(false);
    } catch {
      setErrorMsg("Error saving experience to database. Please check your network.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId && onDeleteExperience) {
      await onDeleteExperience(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-typography-main">Work Experience</h2>
          </div>
          {isEditable && (
            <p className="text-xs text-typography-muted pt-0.5">
              Drag the handle <GripVertical className="inline w-3.5 h-3.5 text-slate-400" /> to reorder priority.
            </p>
          )}
        </div>
        {isEditable && onAddExperience && (
          <Button
            size="sm"
            variant="outline"
            data-testid="add-experience-btn"
            className="gap-1.5 border-brand-primary text-brand-primary hover:bg-brand-primary/10 cursor-pointer"
            onClick={openAddModal}
          >
            <Plus className="w-4 h-4" /> Add Experience
          </Button>
        )}
      </div>

      {experiences.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-surface-border rounded-xl space-y-3 bg-surface-subtle">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-typography-heading">No work experiences added yet</p>
          <p className="text-xs text-typography-muted max-w-sm mx-auto">
            Showcase your past roles, leadership, and accomplishments to stand out to hiring managers.
          </p>
          {isEditable && onAddExperience && (
            <Button
              size="sm"
              variant="default"
              data-testid="add-experience-btn"
              className="bg-brand-primary hover:bg-brand-hover text-white gap-2 cursor-pointer"
              onClick={openAddModal}
            >
              <Plus className="w-4 h-4" /> Add Your First Experience
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((job, idx) => (
            <TimelineItemCard
              key={job.id}
              id={job.id}
              index={idx}
              title={job.title}
              companyName={job.company_name}
              fromYear={job.from_date_year}
              toYear={job.to_date_year}
              currentlyWorkHere={job.currently_work_here}
              description={job.description}
              isDraggable={isEditable}
              isDragged={draggedIndex === idx}
              isDragOver={dragOverIndex === idx}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onEdit={onUpdateExperience || onUpdate ? () => openEditModal(job) : undefined}
              onDelete={() => setDeleteId(job.id)}
              isEditable={isEditable}
            />
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogOverlay />
        <DialogContent className="max-w-lg w-full p-6 space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-primary" />
              <DialogTitle className="text-lg font-bold text-typography-main">
                {editingId ? "Edit Work Experience" : "Add Work Experience"}
              </DialogTitle>
            </div>
          </DialogHeader>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{errorMsg}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Job Title *</label>
              <Input
                required
                placeholder="e.g. Senior Software Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Company Name *</label>
              <Input
                required
                list="company-catalog-options"
                placeholder="e.g. Stripe, Google, Acme Corp"
                value={company}
                onChange={(e) => {
                  const val = e.target.value;
                  setCompany(val);
                  const found = companySuggestions.find((c) => c.name === val);
                  if (found?.logo_url) setLogoUrl(found.logo_url);
                }}
              />
              <datalist id="company-catalog-options">
                {companySuggestions.map((c) => (
                  <option key={c.name} value={c.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-typography-heading">From Year</label>
                <Input type="number" min={1990} max={2030} value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-typography-heading">To Year</label>
                <Input type="number" min={1990} max={2030} disabled={currentlyWork} value={toYear} onChange={(e) => setToYear(Number(e.target.value))} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="expCurrentlyWork"
                checked={currentlyWork}
                onChange={(e) => setCurrentlyWork(e.target.checked)}
                className="rounded text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="expCurrentlyWork" className="text-xs text-typography-heading cursor-pointer">
                I currently work here
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Description & Achievements</label>
              <Textarea rows={3} placeholder="Key responsibilities, stack used, and accomplishments..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <DialogFooter className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} data-testid="experience-modal-submit" className="bg-brand-primary hover:bg-brand-hover text-white">
                {editingId ? "Update Experience" : "Save Experience to DB"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Experience"
        description="Are you sure you want to remove this work experience? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
