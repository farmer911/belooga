"use client";

import * as React from "react";

export interface LanguagesInterestsCardProps {
  languages?: Array<{ name: string; proficiency: string }>;
  interests?: string[];
}

export function LanguagesInterestsCard({
  languages,
  interests,
}: LanguagesInterestsCardProps) {
  if (!languages?.length && !interests?.length) return null;

  return (
    <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#252525]">
        Languages & Interests
      </h3>
      {languages && languages.length > 0 && (
        <div className="space-y-2 text-xs">
          {languages.map((lang, idx) => (
            <div key={idx} className="flex justify-between text-[#515151]">
              <span className="font-medium">{lang.name}</span>
              <span className="text-slate-400">{lang.proficiency}</span>
            </div>
          ))}
        </div>
      )}
      {interests && interests.length > 0 && (
        <div className="pt-2 border-t border-[#f0f2f5] flex flex-wrap gap-1.5">
          {interests.map((interest, idx) => (
            <span key={idx} className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600">
              #{interest}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
