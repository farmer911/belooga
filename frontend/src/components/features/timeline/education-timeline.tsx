"use client";

import * as React from "react";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EducationExperience } from "@/hooks/use-candidate-profile";

export interface EducationTimelineProps {
  education: EducationExperience[];
  onAddEducation?: (payload: Omit<EducationExperience, "id">) => Promise<any>;
  onDeleteEducation?: (id: string) => Promise<void> | void;
  isEditable?: boolean;
}

export function EducationTimeline({
  education,
  onAddEducation,
  onDeleteEducation,
  isEditable = true,
}: EducationTimelineProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Form state
  const [school, setSchool] = React.useState("");
  const [degree, setDegree] = React.useState("");
  const [gpa, setGpa] = React.useState("3.8");
  const [fromYear, setFromYear] = React.useState(2018);
  const [toYear, setToYear] = React.useState(2022);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !degree || !onAddEducation) return;
    setIsSubmitting(true);
    try {
      await onAddEducation({
        school_name: school,
        degree_name: degree,
        gpa,
        from_date_year: Number(fromYear),
        from_date_month: 9,
        currently_work_here: false,
        to_date_year: Number(toYear),
        to_date_month: 6,
        description: "",
      });
      setSchool("");
      setDegree("");
      setGpa("3.8");
      setModalOpen(false);
    } catch (err) {
      alert("Error saving education to database.");
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
    <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#5bbbae]" />
          <h2 className="text-lg font-bold text-[#252525]">Education</h2>
        </div>
        {isEditable && onAddEducation && (
          <Button
            size="sm"
            variant="outline"
            data-testid="add-education-btn"
            className="gap-1.5 border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae]/10 cursor-pointer"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> Add Education
          </Button>
        )}
      </div>

      {education.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-[#d1d6da] rounded-xl space-y-3 bg-[#fafafa]">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-[#515151]">No education credentials listed</p>
          <p className="text-xs text-[#737475] max-w-sm mx-auto">
            Add your university, degrees, and academic honors.
          </p>
          {isEditable && onAddEducation && (
            <Button
              size="sm"
              variant="default"
              className="bg-[#5bbbae] hover:bg-[#497d76] text-white gap-2 cursor-pointer"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="w-4 h-4" /> Add Education
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {education.map((edu) => (
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
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {edu.from_date_year || 2018} — {edu.to_date_year || 2022}
                    </span>
                    {isEditable && onDeleteEducation && (
                      <button
                        type="button"
                        onClick={() => setDeleteId(edu.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                        title="Delete education"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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

      {/* Add Education Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogOverlay />
        <DialogContent className="max-w-lg w-full p-6 space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#5bbbae]" />
              <DialogTitle className="text-lg font-bold text-[#252525]">Add Education Credential</DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">School / University *</label>
              <Input
                required
                placeholder="e.g. Stanford University, MIT"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Degree & Major *</label>
              <Input
                required
                placeholder="e.g. B.S. in Computer Science"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">GPA</label>
                <Input
                  placeholder="3.8 / 4.0"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">Start Year</label>
                <Input
                  type="number"
                  min={1990}
                  max={2030}
                  value={fromYear}
                  onChange={(e) => setFromYear(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">Grad Year</label>
                <Input
                  type="number"
                  min={1990}
                  max={2030}
                  value={toYear}
                  onChange={(e) => setToYear(Number(e.target.value))}
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="education-modal-submit"
                className="bg-[#5bbbae] hover:bg-[#497d76] text-white"
              >
                Save Education to DB
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
        title="Delete Education"
        description="Are you sure you want to remove this education credential?"
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
