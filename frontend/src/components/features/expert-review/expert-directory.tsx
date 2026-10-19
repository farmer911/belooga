"use client";

import { ExpertCard } from "./expert-card";
import { ExpertProfile } from "@/hooks/use-expert-review";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { Search } from "lucide-react";

interface ExpertDirectoryProps {
  experts: ExpertProfile[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onRequestReview: (expert: ExpertProfile) => void;
}

const CATEGORIES = [
  "All",
  "Backend & Systems",
  "Frontend & Web",
  "AI & Machine Learning",
];

export function ExpertDirectory({
  experts,
  selectedCategory,
  onSelectCategory,
  onRequestReview,
}: ExpertDirectoryProps) {
  return (
    <section id="experts-section" className="py-16 bg-surface-card border-b border-surface-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <Badge variant="teal" className="mb-2">
              Mentorship Network
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-typography-main">
              Meet Our Senior Reviewers
            </h2>
            <p className="mt-1 text-sm text-typography-body">
              Every reviewer is vetted and currently working in senior or principal engineering roles.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    active
                      ? "bg-brand-primary text-white shadow-xs"
                      : "bg-surface-divider text-typography-heading hover:bg-surface-border"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {experts.length === 0 ? (
          <EmptyState
            icon={<Search className="h-8 w-8 text-typography-muted" />}
            title="No experts found"
            description="No active reviewers currently match this role category. Try selecting another domain."
            action={{
              label: "View All Experts",
              onClick: () => onSelectCategory("All"),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                onRequestReview={onRequestReview}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
