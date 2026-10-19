"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Loader2 } from "lucide-react";
import { ReviewPackage, ExpertProfile, ReviewOrder } from "@/hooks/use-expert-review";
import { getApiErrorDetail } from "@/services/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FormField } from "@/components/common/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { reviewBookingSchema, ReviewBookingFormValues } from "@/lib/schemas";
import Link from "next/link";

interface ReviewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPackage: ReviewPackage | null;
  selectedExpert: ExpertProfile | null;
  packages: ReviewPackage[];
  onSubmitOrder: (payload: {
    package_slug: string;
    expert_id?: string;
    resume_url: string;
    target_role: string;
    target_companies?: string;
    candidate_notes?: string;
  }) => Promise<ReviewOrder>;
  onCheckout: (orderId: string) => Promise<unknown>;
}

export function ReviewBookingDialog({
  open,
  onOpenChange,
  selectedPackage,
  selectedExpert,
  packages,
  onSubmitOrder,
  onCheckout,
}: ReviewBookingDialogProps) {
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<"details" | "payment">("details");
  const activePackageSlug = selectedPackage?.slug || (packages[0]?.slug ?? "pro");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewBookingFormValues>({
    resolver: zodResolver(reviewBookingSchema),
    defaultValues: {
      targetRole: "Senior Fullstack Engineer",
      targetCompanies: "Google, Stripe, Scale AI",
      candidateNotes: "",
    },
  });

  const currentPkg = packages.find((p) => p.slug === activePackageSlug) || packages[0];

  const handleNextToPayment = handleSubmit(async (values) => {
    if (!isAuthenticated) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const order = await onSubmitOrder({
        package_slug: activePackageSlug,
        expert_id: selectedExpert?.id,
        resume_url: "/uploads/resumes/default_resume.pdf",
        target_role: values.targetRole,
        target_companies: values.targetCompanies,
        candidate_notes: values.candidateNotes,
      });
      setCreatedOrderId(order.id);
      setStep("payment");
    } catch (err: unknown) {
      setErrorMsg(getApiErrorDetail(err, "Failed to create review booking order"));
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleConfirmPayment = async () => {
    if (!createdOrderId) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onCheckout(createdOrderId);
      onOpenChange(false);
      setStep("details");
      setCreatedOrderId(null);
    } catch (err: unknown) {
      setErrorMsg(getApiErrorDetail(err, "Checkout payment failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="teal" className="text-[10px]">
              {step === "details" ? "Step 1 of 2: Information" : "Step 2 of 2: Checkout"}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-typography-main">
            {step === "details" ? "Book Expert CV Review" : "Confirm Payment"}
          </DialogTitle>
          <DialogDescription>
            {step === "details"
              ? "Share your target career aspirations to help the reviewer personalize advice."
              : "Review your order summary and simulate payment."}
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-typography-heading">
              Please login or create a candidate account to order an expert CV review.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/login">
                <Button variant="outline" className="border-brand-primary text-brand-primary">
                  Login to Continue
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-brand-primary text-white">Register</Button>
              </Link>
            </div>
          </div>
        ) : step === "details" ? (
          <form onSubmit={handleNextToPayment} noValidate className="space-y-4 py-2">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {errorMsg}
              </div>
            )}

            <Card className="p-3.5 bg-surface-page border border-surface-border flex items-center justify-between">
              <div>
                <div className="text-xs text-typography-muted">Selected Review Package:</div>
                <div className="text-sm font-bold text-typography-main">{currentPkg?.name} (${(currentPkg?.price_cents ?? 0) / 100})</div>
                {selectedExpert && (
                  <div className="text-xs text-brand-primary mt-0.5">
                    Reviewer: {selectedExpert.full_name} ({selectedExpert.company})
                  </div>
                )}
              </div>
              <Badge variant="outline" className="text-xs">{currentPkg?.turn_around_hours}h Turnaround</Badge>
            </Card>

            <FormField label="Target Role / Job Title" required error={errors.targetRole?.message}>
              <Input
                placeholder="e.g. Senior Backend Engineer"
                {...register("targetRole")}
              />
            </FormField>

            <FormField label="Target Companies or Industry" error={errors.targetCompanies?.message}>
              <Input
                placeholder="e.g. Stripe, OpenAI, FinTech startups"
                {...register("targetCompanies")}
              />
            </FormField>

            <FormField label="Specific Questions for the Reviewer" error={errors.candidateNotes?.message}>
              <Textarea
                placeholder="e.g. Is my work experience at my previous company described with enough quantitative impact? How is my layout passing ATS?"
                {...register("candidateNotes")}
              />
            </FormField>

            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-brand-primary hover:bg-brand-hover text-white">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Proceed to Payment (${((currentPkg?.price_cents || 0) / 100).toFixed(0)})
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 py-3">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {errorMsg}
              </div>
            )}

            <Card className="p-4 bg-surface-page border border-surface-border space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-typography-body">{currentPkg?.name}</span>
                <span className="text-typography-main font-bold">${((currentPkg?.price_cents || 0) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-typography-muted">
                <span>Platform Processing & Delivery Guarantee</span>
                <span>Included</span>
              </div>
              <div className="border-t border-surface-border pt-2 flex justify-between text-base font-bold text-typography-main">
                <span>Total Amount</span>
                <span className="text-brand-primary">${((currentPkg?.price_cents || 0) / 100).toFixed(2)}</span>
              </div>
            </Card>

            <div className="p-3.5 rounded-lg border border-surface-border bg-surface-card space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-typography-main">
                <CreditCard className="h-4 w-4 text-brand-primary" />
                <span>Simulated Secure Card Payment</span>
              </div>
              <p className="text-[11px] text-typography-muted">
                Test card environment enabled. Click confirm to simulate a successful payment transaction.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("details")}
                className="w-1/3 border-surface-border"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="w-2/3 bg-brand-primary hover:bg-brand-hover text-white"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Payment & Submit
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
