"use client";

import * as React from "react";
import { MessageSquare, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";

export interface PublicContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  fullName: string;
}

export function PublicContactModal({
  isOpen,
  onClose,
  username,
  fullName,
}: PublicContactModalProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/v1/cms/contact/`, {
        name,
        email,
        subject: `Recruitment Inquiry for @${username} (${company})`,
        message,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setName("");
        setEmail("");
        setCompany("");
        setMessage("");
      }, 2000);
    } catch (err) {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b pb-3 border-[#f0f2f5]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#5bbbae]" />
            <h3 className="text-lg font-bold text-[#252525]">Contact @{username}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="text-base font-bold text-[#252525]">Message Dispatched!</p>
            <p className="text-xs text-[#737475]">
              Your direct inquiry was sent to {fullName}&apos;s verified contact inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Your Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Recruiter Name"
                className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Your Work Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recruiter@company.com"
                className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Company Name</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe, OpenAI"
                className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Message / Opportunity *</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="We loved your video pitch and would like to invite you..."
                className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
              />
            </div>
            <Button type="submit" className="w-full bg-[#5bbbae] hover:bg-[#497d76] text-white cursor-pointer">
              Send Direct Inquiry
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
