"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";

interface FaqItem {
  id?: number;
  category?: string;
  question: string;
  answer: string;
}

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: faqs = [] } = useQuery<FaqItem[]>({
    queryKey: ["public-faqs"],
    queryFn: async () => {
      const res = await apiClient.get<FaqItem[]>("/v1/faqs");
      return res.data;
    },
  });

  const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category || "General")))];
  const filteredFaqs = faqs.filter((f) => {
    const matchesCat = selectedCategory === "All" || (f.category || "General") === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesText =
      !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    return matchesCat && matchesText;
  });

  return (
    <div className="min-h-screen bg-surface-page py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-typography-main">Help Center & FAQs</h1>
          <p className="text-sm text-typography-muted max-w-xl mx-auto">
            Frequently asked questions about creating video elevator pitches, recruiter discovery, and account privacy.
          </p>
        </div>

        {/* Category & Instant Search Filter Bar */}
        <div
          data-testid="help-faq-filter-bar"
          className="bg-surface-card rounded-xl border border-surface-border p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        >
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setOpenIndex(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  selectedCategory === cat
                    ? "bg-brand-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-surface-border pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        {/* FAQs Accordion */}
        <div data-testid="help-faq-accordion" className="bg-surface-card rounded-xl border border-surface-border p-8 shadow-sm divide-y divide-surface-divider space-y-4">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={faq.id ?? idx} className="pt-4 first:pt-0">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left py-2 font-bold text-base text-typography-main hover:text-brand-primary transition-colors"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-brand-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="text-sm text-typography-body leading-relaxed pt-2 pb-2">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold">Still have questions?</h3>
            <p className="text-xs text-slate-300">Our customer success team can guide you through optimizing your candidate pitch.</p>
          </div>
          <Link href="/contact-us">
            <Button size="default" className="bg-brand-primary hover:bg-brand-hover text-white gap-2">
              <MessageCircle className="w-4 h-4" /> Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
