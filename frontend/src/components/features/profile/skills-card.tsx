"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkillBadge } from "@/components/common/skill-badge";
import { apiClient } from "@/services/api-client";
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

export function SkillsCard({
  skills,
  onAddSkill,
  onRemoveSkill,
  isEditable = true,
}: SkillsCardProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [newSkillText, setNewSkillText] = React.useState("");

  const { data: catalogSkills = [] } = useQuery<string[]>({
    queryKey: ["catalog-skills"],
    queryFn: async () => {
      const res = await apiClient.get<string[]>("/v1/profile/skills/");
      return res.data ?? [];
    },
    staleTime: 60_000,
  });

  const availableSuggestions = catalogSkills.filter((s) => !skills.includes(s)).slice(0, 8);

  const handleAdd = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    onAddSkill?.(trimmed);
    setNewSkillText("");
    setModalOpen(false);
  };

  return (
    <div data-testid="skills-container" className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-typography-main">
          Skills & Strengths
        </h3>
        {isEditable && onAddSkill && (
          <button
            type="button"
            data-testid="add-skill-btn"
            onClick={() => setModalOpen(true)}
            className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <SkillBadge
            key={skill}
            skill={skill}
            removable={isEditable && Boolean(onRemoveSkill)}
            onRemove={onRemoveSkill}
            variant="default"
            size="md"
            className="px-2.5 py-1 bg-surface-page border border-surface-border rounded-md text-xs font-medium text-typography-heading hover:border-brand-primary transition-colors"
          />
        ))}
      </div>

      {/* Suggested additions */}
      {isEditable && onAddSkill && (
        <div className="pt-2 border-t border-surface-divider">
          <p className="text-[11px] text-typography-muted mb-1.5">Suggested additions:</p>
          <div className="flex flex-wrap gap-1.5">
            {availableSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                data-testid="skill-suggestion-item"
                onClick={() => handleAdd(s)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-brand-primary/15 hover:text-brand-dark text-typography-heading transition-colors cursor-pointer"
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
            <DialogTitle className="text-base font-bold text-typography-main">Add Skill or Strength</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              data-testid="skill-autocomplete-input"
              list="skill-catalog-options"
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
            <datalist id="skill-catalog-options">
              {catalogSkills.map((sk) => (
                <option key={sk} value={sk} />
              ))}
            </datalist>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-brand-primary hover:bg-brand-hover text-white"
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
