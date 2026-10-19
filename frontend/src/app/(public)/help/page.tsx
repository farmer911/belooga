"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";

interface FaqItem {
  question: string;
  answer: string;
}

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { data: faqs = [] } = useQuery<FaqItem[]>({
    queryKey: ["public-faqs"],
    queryFn: async () => {
      const res = await apiClient.get<FaqItem[]>("/v1/faqs");
      return res.data;
    },
  });

  return (
    <div className="min-h-screen bg-surface-page py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-typography-main">Help Center & FAQs</h1>
          <p className="text-sm text-typography-muted max-w-xl mx-auto">
            Frequently asked questions about creating video elevator pitches, recruiter discovery, and account privacy.
          </p>
        </div>

        {/* FAQs Accordion */}
        <div data-testid="help-faq-accordion" className="bg-surface-card rounded-xl border border-surface-border p-8 shadow-sm divide-y divide-surface-divider space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="pt-4 first:pt-0">
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
