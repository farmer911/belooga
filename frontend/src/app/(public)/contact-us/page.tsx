"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import { contactUsSchema, ContactUsValues } from "@/lib/schemas";

const INPUT_CLS =
  "w-full px-3 py-2.5 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary";

export default function ContactUsPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactUsValues>({
    resolver: zodResolver(contactUsSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const contactMutation = useMutation({
    mutationFn: async (values: ContactUsValues) => {
      await apiClient.post("/v1/contact/", values);
    },
    onSuccess: () => {
      setIsSuccess(true);
      reset();
    },
    onError: () => {
      alert("Failed to submit inquiry. Please try again.");
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await contactMutation.mutateAsync(values);
  });

  return (
    <div className="min-h-screen bg-surface-page py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold text-typography-main">Contact Belooga Support</h1>
          <p className="text-sm text-typography-muted max-w-xl mx-auto">
            Have questions about video resumes, candidate screening, or employer partnerships? Our support team is here to assist.
          </p>
        </div>

        <div className="bg-surface-card rounded-xl border border-surface-border p-8 shadow-sm max-w-2xl mx-auto">
          {isSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Thank you! Your message has been received. Our team will get back to you within 24 hours.</span>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate data-testid="contact-form" className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Full Name</label>
              <input
                type="text"
                placeholder="Alex Morgan"
                className={INPUT_CLS}
                {...register("name")}
              />
              {errors.name && <p className="text-[11px] text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Email Address</label>
              <input
                type="email"
                placeholder="alex@company.com"
                className={INPUT_CLS}
                {...register("email")}
              />
              {errors.email && <p className="text-[11px] text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Inquiry Message</label>
              <textarea
                rows={5}
                placeholder="How can we help your team?"
                className={INPUT_CLS}
                {...register("message")}
              />
              {errors.message && <p className="text-[11px] text-red-600">{errors.message.message}</p>}
            </div>

            <Button
              type="submit"
              data-testid="contact-submit-btn"
              disabled={contactMutation.isPending}
              className="w-full bg-brand-primary hover:bg-brand-hover text-white py-3 gap-2"
            >
              {contactMutation.isPending ? "Submitting..." : "Send Message"}
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
