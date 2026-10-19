"use client";

import { CheckCircle2, ShieldCheck, Sparkles, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpertHeroProps {
  onBrowseExperts: () => void;
  onViewPricing: () => void;
}

export function ExpertHero({ onBrowseExperts, onViewPricing }: ExpertHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-overlay to-white border-b border-surface-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-overlay px-3.5 py-1 text-xs font-semibold text-brand-dark mb-6">
            <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
            <span>Top 1% Verified Silicon Valley Mentors</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-typography-main leading-tight">
            Get Your CV Reviewed by <br className="hidden sm:inline" />
            <span className="text-brand-primary">Senior Staff & Engineering Leaders</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-lg text-typography-body leading-relaxed">
            Stand out in competitive recruitment pipelines. Receive actionable, line-by-line bullet rewriting,
            ATS optimization, and an async video walkthrough from leaders at Google, Stripe, and OpenAI.
          </p>

          {/* CTA Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" onClick={onViewPricing} className="bg-brand-primary hover:bg-brand-hover text-white px-8">
              Explore Review Packages
            </Button>
            <Button size="lg" variant="outline" onClick={onBrowseExperts} className="border-surface-border">
              Meet The Experts
            </Button>
          </div>

          {/* Value Pillars */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-surface-border">
            <div className="flex items-center justify-center gap-2 text-sm text-typography-heading">
              <Clock className="h-4 w-4 text-brand-primary" />
              <span className="font-medium">Guaranteed 24-48h Delivery</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-typography-heading">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="font-medium">4.97 / 5 Average Reviewer Rating</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-typography-heading">
              <ShieldCheck className="h-4 w-4 text-brand-primary" />
              <span className="font-medium">100% Satisfaction Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
