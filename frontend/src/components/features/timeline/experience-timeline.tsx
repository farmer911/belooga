"use client";

import * as React from "react";
import { Briefcase, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { JobExperience } from "@/hooks/use-candidate-profile";
import { useTimelineDnD } from "@/hooks/use-timeline-dnd";
import { TimelineItemCard } from "./timeline-item-card";

export interface ExperienceTimelineProps {
  experiences: JobExperience[];
  onAddExperience?: (payload: Omit<JobExperience, "id">) => Promise<any>;
  onDeleteExperience?: (id: string) => Promise<void> | void;
  onReorderExperiences?: (items: JobExperience[]) => Promise<void> | void;
  isEditable?: boolean;
}

export function ExperienceTimeline({
  experiences,
  onAddExperience,
  onDeleteExperience,
  onReorderExperiences,
  isEditable = true,
}: ExperienceTimelineProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Form state
  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [fromYear, setFromYear] = React.useState(2022);
  const [currentlyWork, setCurrentlyWork] = React.useState(false);
  const [toYear, setToYear] = React.useState(2024);
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
  } = useTimelineDnD({
    items: experiences,
    onReorder: onReorderExperiences || (() => {}),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company || !onAddExperience) return;
    setIsSubmitting(true);
    try {
      await onAddExperience({
        title,
        company_name: company,
        from_date_year: Number(fromYear),
        from_date_month: 1,
        currently_work_here: currentlyWork,
        to_date_year: currentlyWork ? null : Number(toYear),
        to_date_month: currentlyWork ? null : 12,
        description,
        logo_url: "/images/logo-big.png",
      });
      setTitle("");
      setCompany("");
      setDescription("");
      setModalOpen(false);
    } catch (err) {
      alert("Error saving experience to database. Please check your network.");
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
    <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#5bbbae]" />
            <h2 className="text-lg font-bold text-[#252525]">Work Experience</h2>
          </div>
          {isEditable && (
            <p className="text-xs text-[#737475] pt-0.5">
              Drag the handle <GripVertical className="inline w-3.5 h-3.5 text-slate-400" /> to reorder priority.
            </p>
          )}
        </div>
        {isEditable && onAddExperience && (
          <Button
            size="sm"
            variant="outline"
            data-testid="add-experience-btn"
            className="gap-1.5 border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae]/10 cursor-pointer"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> Add Experience
          </Button>
        )}
      </div>

      {experiences.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-[#d1d6da] rounded-xl space-y-3 bg-[#fafafa]">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-[#515151]">No work experiences added yet</p>
          <p className="text-xs text-[#737475] max-w-sm mx-auto">
            Showcase your past roles, leadership, and accomplishments to stand out to hiring managers.
          </p>
          {isEditable && onAddExperience && (
            <Button
              size="sm"
              variant="default"
              data-testid="add-experience-btn"
              className="bg-[#5bbbae] hover:bg-[#497d76] text-white gap-2 cursor-pointer"
              onClick={() => setModalOpen(true)}
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
              onDelete={() => setDeleteId(job.id)}
              isEditable={isEditable}
            />
          ))}
        </div>
      )}

      {/* Add Experience Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogOverlay />
        <DialogContent className="max-w-lg w-full p-6 space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#5bbbae]" />
              <DialogTitle className="text-lg font-bold text-[#252525]">Add Work Experience</DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Job Title *</label>
              <Input
                required
                placeholder="e.g. Senior Software Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Company Name *</label>
              <Input
                required
                placeholder="e.g. Stripe, Google, Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">From Year</label>
                <Input
                  type="number"
                  min={1990}
                  max={2030}
                  value={fromYear}
                  onChange={(e) => setFromYear(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">To Year</label>
                <Input
                  type="number"
                  min={1990}
                  max={2030}
                  disabled={currentlyWork}
                  value={toYear}
                  onChange={(e) => setToYear(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="expCurrentlyWork"
                checked={currentlyWork}
                onChange={(e) => setCurrentlyWork(e.target.checked)}
                className="rounded text-[#5bbbae] focus:ring-[#5bbbae]"
              />
              <label htmlFor="expCurrentlyWork" className="text-xs text-[#515151] cursor-pointer">
                I currently work here
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Description & Achievements</label>
              <Textarea
                rows={3}
                placeholder="Key responsibilities, stack used, and accomplishments..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="experience-modal-submit"
                className="bg-[#5bbbae] hover:bg-[#497d76] text-white"
              >
                Save Experience to DB
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
