"use client";

import * as React from "react";
import { Plus } from "lucide-react";
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

export interface SkillsCardProps {
  skills: string[];
  onAddSkill?: (skill: string) => void;
  onRemoveSkill?: (skill: string) => void;
  isEditable?: boolean;
}

const SUGGESTIONS = ["Next.js", "Python", "Docker", "Figma", "Tailwind CSS"];

export function SkillsCard({
  skills,
  onAddSkill,
  onRemoveSkill,
  isEditable = true,
}: SkillsCardProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [newSkillText, setNewSkillText] = React.useState("");

  const handleAdd = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    onAddSkill?.(trimmed);
    setNewSkillText("");
    setModalOpen(false);
  };

  return (
    <div data-testid="skills-container" className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#252525]">
          Skills & Strengths
        </h3>
        {isEditable && onAddSkill && (
          <button
            type="button"
            data-testid="add-skill-btn"
            onClick={() => setModalOpen(true)}
            className="text-xs font-semibold text-[#5bbbae] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span
            key={idx}
            data-testid="skill-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#f8f9fa] border border-[#d1d6da] rounded-md text-xs font-medium text-[#515151] hover:border-[#5bbbae] transition-colors"
          >
            <span>{skill}</span>
            {isEditable && onRemoveSkill && (
              <button
                type="button"
                data-testid="remove-skill-btn"
                onClick={() => onRemoveSkill(skill)}
                className="text-slate-400 hover:text-red-500 rounded p-0.5 cursor-pointer"
                title="Remove skill"
              >
                <span className="text-xs font-bold leading-none select-none">×</span>
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Suggested additions */}
      {isEditable && onAddSkill && (
        <div className="pt-2 border-t border-[#f0f2f5]">
          <p className="text-[11px] text-[#737475] mb-1.5">Suggested additions:</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                data-testid="skill-suggestion-item"
                onClick={() => handleAdd(s)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-[#5bbbae]/15 hover:text-[#21655e] text-[#515151] transition-colors cursor-pointer"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Skill Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogOverlay />
        <DialogContent className="max-w-sm w-full p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#252525]">Add Skill or Strength</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              data-testid="skill-autocomplete-input"
              autoFocus
              placeholder="e.g. Next.js, Kubernetes, FastAPI"
              value={newSkillText}
              onChange={(e) => setNewSkillText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAdd(newSkillText);
                }
              }}
            />

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#5bbbae] hover:bg-[#497d76] text-white"
                onClick={() => handleAdd(newSkillText)}
              >
                Add Skill
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
