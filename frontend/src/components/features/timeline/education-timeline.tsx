"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Plus, Trash2, Pencil, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { apiClient } from "@/services/api-client";
import { EducationExperience } from "@/hooks/use-candidate-profile";
import { useTimelineDnD } from "@/hooks/use-timeline-dnd";

export interface EducationTimelineProps {
  education: EducationExperience[];
  onAddEducation?: (payload: Omit<EducationExperience, "id">) => Promise<unknown>;
  onUpdateEducation?: (id: string, payload: Partial<EducationExperience>) => Promise<void> | void;
  onDeleteEducation?: (id: string) => Promise<void> | void;
  onReorderEducation?: (items: EducationExperience[]) => Promise<void> | void;
  isEditable?: boolean;
}

export function EducationTimeline({
  education,
  onAddEducation,
  onUpdateEducation,
  onDeleteEducation,
  onReorderEducation,
  isEditable = true,
}: EducationTimelineProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [school, setSchool] = React.useState("");
  const [degree, setDegree] = React.useState("");
  const [gpa, setGpa] = React.useState("3.8");
  const [fromYear, setFromYear] = React.useState(2018);
  const [toYear, setToYear] = React.useState(2022);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { data: schoolSuggestions = [] } = useQuery<Array<{ name: string }>>({
    queryKey: ["catalog-schools", school],
    queryFn: async () =>
      (await apiClient.get<Array<{ name: string }>>(`/v1/profile/school/?name=${encodeURIComponent(school)}`)).data,
    enabled: modalOpen,
  });

  const { draggedIndex, dragOverIndex, handleDragStart, handleDragOver, handleDrop } = useTimelineDnD({
    items: education,
    onReorder: onReorderEducation || (() => {}),
  });

  const moveItem = (index: number, direction: -1 | 1) => {
    if (!onReorderEducation) return;
    const target = index + direction;
    if (target < 0 || target >= education.length) return;
    const next = [...education];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    onReorderEducation(next);
  };

  const openAddModal = () => {
    setEditingId(null);
    setSchool(""); setDegree(""); setGpa("3.8"); setFromYear(2018); setToYear(2022);
    setErrorMsg(null); setModalOpen(true);
  };

  const openEditModal = (edu: EducationExperience) => {
    setEditingId(edu.id);
    setSchool(edu.school_name); setDegree(edu.degree_name); setGpa(edu.gpa || "3.8");
    setFromYear(edu.from_date_year || 2018); setToYear(edu.to_date_year || 2022);
    setErrorMsg(null); setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !degree) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    const payload = {
      school_name: school,
      degree_name: degree,
      gpa,
      from_date_year: Number(fromYear),
      from_date_month: 9,
      currently_work_here: false,
      to_date_year: Number(toYear),
      to_date_month: 6,
      description: "",
    };
    try {
      if (editingId && onUpdateEducation) {
        await onUpdateEducation(editingId, payload);
      } else if (onAddEducation) {
        await onAddEducation(payload);
      }
      setModalOpen(false);
    } catch {
      setErrorMsg("Error saving education to database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId && onDeleteEducation) {
      await onDeleteEducation(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-brand-primary" />
          <h2 className="text-lg font-bold text-typography-main">Education</h2>
        </div>
        {isEditable && onAddEducation && (
          <Button
            size="sm"
            variant="outline"
            data-testid="add-education-btn"
            className="gap-1.5 border-brand-primary text-brand-primary hover:bg-brand-primary/10 cursor-pointer"
            onClick={openAddModal}
          >
            <Plus className="w-4 h-4" /> Add Education
          </Button>
        )}
      </div>

      {education.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-surface-border rounded-xl space-y-3 bg-surface-subtle">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-typography-heading">No education credentials listed</p>
          <p className="text-xs text-typography-muted max-w-sm mx-auto">Add your university, degrees, and academic honors.</p>
          {isEditable && onAddEducation && (
            <Button size="sm" variant="default" className="bg-brand-primary hover:bg-brand-hover text-white gap-2 cursor-pointer" onClick={openAddModal}>
              <Plus className="w-4 h-4" /> Add Education
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {education.map((edu, idx) => (
            <div
              key={edu.id}
              draggable={isEditable && Boolean(onReorderEducation) ? "true" : undefined}
              onDragStart={isEditable ? () => handleDragStart(idx) : undefined}
              onDragOver={isEditable ? (e) => handleDragOver(e, idx) : undefined}
              onDrop={isEditable ? () => handleDrop(idx) : undefined}
              className={`p-4 rounded-lg border bg-surface-page flex items-start gap-4 transition-all ${
                draggedIndex === idx ? "opacity-40 border-dashed border-brand-primary" : dragOverIndex === idx ? "border-brand-primary bg-teal-50/40" : "border-surface-border"
              }`}
            >
              {isEditable && onReorderEducation && (
                <div className="flex flex-col items-center gap-0.5 text-slate-400 pt-0.5">
                  <GripVertical className="w-4 h-4 cursor-grab" />
                  <button type="button" onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="hover:text-brand-primary disabled:opacity-30 cursor-pointer" title="Move up">
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => moveItem(idx, 1)} disabled={idx === education.length - 1} className="hover:text-brand-primary disabled:opacity-30 cursor-pointer" title="Move down">
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 p-2 flex items-center justify-center flex-shrink-0 text-brand-dark">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-typography-main">{edu.school_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {edu.from_date_year || 2018} — {edu.to_date_year || 2022}
                    </span>
                    {isEditable && onUpdateEducation && (
                      <button type="button" data-testid="edit-education-btn" onClick={() => openEditModal(edu)} className="text-slate-300 hover:text-brand-primary p-1 cursor-pointer" title="Edit education">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {isEditable && onDeleteEducation && (
                      <button type="button" onClick={() => setDeleteId(edu.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer" title="Delete education">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs font-semibold text-brand-primary">{edu.degree_name}</p>
                {edu.gpa && <p className="text-xs text-typography-body">GPA: {edu.gpa}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogOverlay />
        <DialogContent className="max-w-lg w-full p-6 space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-primary" />
              <DialogTitle className="text-lg font-bold text-typography-main">
                {editingId ? "Edit Education Credential" : "Add Education Credential"}
              </DialogTitle>
            </div>
          </DialogHeader>

          {errorMsg && <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">School / University *</label>
              <Input
                required
                list="school-catalog-options"
                placeholder="e.g. Stanford University, MIT"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              />
              <datalist id="school-catalog-options">
                {schoolSuggestions.map((s) => (
                  <option key={s.name} value={s.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Degree & Major *</label>
              <Input required placeholder="e.g. B.S. in Computer Science" value={degree} onChange={(e) => setDegree(e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-typography-heading">GPA</label>
                <Input placeholder="3.8 / 4.0" value={gpa} onChange={(e) => setGpa(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-typography-heading">Start Year</label>
                <Input type="number" min={1990} max={2030} value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-typography-heading">Grad Year</label>
                <Input type="number" min={1990} max={2030} value={toYear} onChange={(e) => setToYear(Number(e.target.value))} />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} data-testid="education-modal-submit" className="bg-brand-primary hover:bg-brand-hover text-white">
                {editingId ? "Update Education" : "Save Education to DB"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Education"
        description="Are you sure you want to remove this education credential?"
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
