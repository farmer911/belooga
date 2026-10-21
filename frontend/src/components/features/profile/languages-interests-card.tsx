"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

export interface LanguagesInterestsCardProps {
  languages?: Array<{ name: string; proficiency: string }>;
  interests?: string[];
  onAddLanguage?: (name: string, proficiency: string) => Promise<void> | void;
  onRemoveLanguage?: (name: string) => Promise<void> | void;
  onAddInterest?: (name: string) => Promise<void> | void;
  onRemoveInterest?: (name: string) => Promise<void> | void;
}

export function LanguagesInterestsCard({
  languages = [],
  interests = [],
  onAddLanguage,
  onRemoveLanguage,
  onAddInterest,
  onRemoveInterest,
}: LanguagesInterestsCardProps) {
  const [langInput, setLangInput] = React.useState("");
  const [profInput, setProfInput] = React.useState("Fluent");
  const [interestInput, setInterestInput] = React.useState("");
  const isEditable = Boolean(onAddLanguage || onAddInterest);

  if (!isEditable && !languages.length && !interests.length) return null;

  return (
    <div
      data-testid="languages-interests-card"
      className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm space-y-4"
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-typography-main">
        Languages & Interests
      </h3>
      <div className="space-y-2 text-xs">
        {languages.map((lang, idx) => (
          <div key={idx} className="flex items-center justify-between text-typography-heading">
            <span className="font-medium">{lang.name}</span>
            <span className="flex items-center gap-2 text-slate-400">
              {lang.proficiency}
              {onRemoveLanguage && (
                <button
                  type="button"
                  onClick={() => onRemoveLanguage(lang.name)}
                  className="text-slate-400 hover:text-red-500 cursor-pointer"
                  title={`Remove ${lang.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          </div>
        ))}
        {onAddLanguage && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!langInput.trim()) return;
              await onAddLanguage(langInput, profInput);
              setLangInput("");
            }}
            className="flex items-center gap-1.5 pt-1"
          >
            <input
              type="text"
              data-testid="language-input"
              placeholder="Add language..."
              value={langInput}
              onChange={(e) => setLangInput(e.target.value)}
              className="flex-1 min-w-0 px-2 py-1 border border-surface-border rounded text-xs"
            />
            <select
              value={profInput}
              onChange={(e) => setProfInput(e.target.value)}
              className="px-1.5 py-1 border border-surface-border rounded text-xs bg-surface-card"
            >
              <option value="Native">Native</option>
              <option value="Fluent">Fluent</option>
              <option value="Business">Business</option>
            </select>
            <button
              type="submit"
              className="p-1 rounded bg-brand-primary text-white hover:bg-brand-hover cursor-pointer"
              title="Add language"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>

      <div className="pt-2 border-t border-surface-divider space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {interests.map((interest, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600"
            >
              #{interest}
              {onRemoveInterest && (
                <button
                  type="button"
                  onClick={() => onRemoveInterest(interest)}
                  className="text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
        {onAddInterest && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!interestInput.trim()) return;
              await onAddInterest(interestInput);
              setInterestInput("");
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              data-testid="interest-input"
              placeholder="Add interest tag..."
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              className="flex-1 min-w-0 px-2 py-1 border border-surface-border rounded text-xs"
            />
            <button
              type="submit"
              className="p-1 rounded bg-brand-primary text-white hover:bg-brand-hover cursor-pointer"
              title="Add interest"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
