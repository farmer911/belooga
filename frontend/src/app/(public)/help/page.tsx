"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";

export default function HelpPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadFaqs() {
      try {
        const res = await apiClient.get("/v1/faqs");
        setFaqs(res.data);
      } catch (err) {
        console.error("Failed to load FAQs", err);
      }
    }
    loadFaqs();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#5bbbae]/15 text-[#5bbbae] flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#252525]">Help Center & FAQs</h1>
          <p className="text-sm text-[#737475] max-w-xl mx-auto">
            Frequently asked questions about creating video elevator pitches, recruiter discovery, and account privacy.
          </p>
        </div>

        {/* FAQs Accordion */}
        <div className="bg-white rounded-xl border border-[#d1d6da] p-8 shadow-sm divide-y divide-[#f0f2f5] space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="pt-4 first:pt-0">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left py-2 font-bold text-base text-[#252525] hover:text-[#5bbbae] transition-colors"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[#5bbbae] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="text-sm text-[#666666] leading-relaxed pt-2 pb-2">
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
            <Button size="default" className="bg-[#5bbbae] hover:bg-[#497d76] text-white gap-2">
              <MessageCircle className="w-4 h-4" /> Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
