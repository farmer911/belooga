"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";

export default function ContactUsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post("/v1/contact/", {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      setIsSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      alert("Failed to submit inquiry. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold text-[#252525]">Contact Belooga Support</h1>
          <p className="text-sm text-[#737475] max-w-xl mx-auto">
            Have questions about video resumes, candidate screening, or employer partnerships? Our support team is here to assist.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#d1d6da] p-8 shadow-sm max-w-2xl mx-auto">
          {isSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Thank you! Your message has been received. Our team will get back to you within 24 hours.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} data-testid="contact-form" className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full px-3 py-2.5 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full px-3 py-2.5 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Inquiry Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help your team?"
                className="w-full px-3 py-2.5 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
              />
            </div>

            <Button
              type="submit"
              data-testid="contact-submit-btn"
              disabled={isLoading}
              className="w-full bg-[#5bbbae] hover:bg-[#497d76] text-white py-3 gap-2"
            >
              {isLoading ? "Submitting..." : "Send Message"}
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
