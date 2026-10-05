"use client";

import { useState } from "react";
import { Check, ShieldCheck, CreditCard, FileUp, Sparkles, Loader2 } from "lucide-react";
import { ReviewPackage, ExpertProfile } from "@/hooks/use-expert-review";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/common/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
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
  }) => Promise<any>;
  onCheckout: (orderId: string) => Promise<any>;
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
  const { isAuthenticated, user } = useAuthStore();
  const [step, setStep] = useState<"details" | "payment">("details");
  const [activePackageSlug, setActivePackageSlug] = useState<string>(
    selectedPackage?.slug || (packages[0]?.slug ?? "pro")
  );
  const [targetRole, setTargetRole] = useState("Senior Fullstack Engineer");
  const [targetCompanies, setTargetCompanies] = useState("Google, Stripe, Scale AI");
  const [candidateNotes, setCandidateNotes] = useState("");
  const [resumeUrl, setResumeUrl] = useState("/uploads/resumes/default_resume.pdf");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentPkg = packages.find((p) => p.slug === activePackageSlug) || packages[0];

  const handleNextToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const order = await onSubmitOrder({
        package_slug: activePackageSlug,
        expert_id: selectedExpert?.id,
        resume_url: resumeUrl,
        target_role: targetRole,
        target_companies: targetCompanies,
        candidate_notes: candidateNotes,
      });
      setCreatedOrderId(order.id);
      setStep("payment");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to create review booking order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!createdOrderId) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onCheckout(createdOrderId);
      onOpenChange(false);
      setStep("details");
      setCreatedOrderId(null);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Checkout payment failed");
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
          <DialogTitle className="text-xl font-bold text-[#252525]">
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
            <p className="text-sm text-[#555555]">
              Please login or create a candidate account to order an expert CV review.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/login">
                <Button variant="outline" className="border-[#5bbbae] text-[#5bbbae]">
                  Login to Continue
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#5bbbae] text-white">Register</Button>
              </Link>
            </div>
          </div>
        ) : step === "details" ? (
          <form onSubmit={handleNextToPayment} className="space-y-4 py-2">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* Selected Expert & Package Summary */}
            <Card className="p-3.5 bg-[#f8fafb] border border-[#e5e9eb] flex items-center justify-between">
              <div>
                <div className="text-xs text-[#777777]">Selected Review Package:</div>
                <div className="text-sm font-bold text-[#252525]">{currentPkg?.name} (${(currentPkg?.price_cents ?? 0) / 100})</div>
                {selectedExpert && (
                  <div className="text-xs text-[#5bbbae] mt-0.5">
                    Reviewer: {selectedExpert.full_name} ({selectedExpert.company})
                  </div>
                )}
              </div>
              <Badge variant="outline" className="text-xs">{currentPkg?.turn_around_hours}h Turnaround</Badge>
            </Card>

            <FormField label="Target Role / Job Title" required>
              <Input
                value={targetRole}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                required
              />
            </FormField>

            <FormField label="Target Companies or Industry">
              <Input
                value={targetCompanies}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetCompanies(e.target.value)}
                placeholder="e.g. Stripe, OpenAI, FinTech startups"
              />
            </FormField>

            <FormField label="Specific Questions for the Reviewer">
              <Textarea
                value={candidateNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCandidateNotes(e.target.value)}
                placeholder="e.g. Is my work experience at my previous company described with enough quantitative impact? How is my layout passing ATS?"
              />
            </FormField>

            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-[#5bbbae] hover:bg-[#497d76] text-white">
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

            <Card className="p-4 bg-[#f8fafb] border border-[#e5e9eb] space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-[#666666]">{currentPkg?.name}</span>
                <span className="text-[#252525] font-bold">${((currentPkg?.price_cents || 0) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#777777]">
                <span>Platform Processing & Delivery Guarantee</span>
                <span>Included</span>
              </div>
              <div className="border-t border-[#e2e8f0] pt-2 flex justify-between text-base font-bold text-[#252525]">
                <span>Total Amount</span>
                <span className="text-[#5bbbae]">${((currentPkg?.price_cents || 0) / 100).toFixed(2)}</span>
              </div>
            </Card>

            <div className="p-3.5 rounded-lg border border-[#d1d6da] bg-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#252525]">
                <CreditCard className="h-4 w-4 text-[#5bbbae]" />
                <span>Simulated Secure Card Payment</span>
              </div>
              <p className="text-[11px] text-[#777777]">
                Test card environment enabled. Click confirm to simulate a successful payment transaction.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("details")}
                className="w-1/3 border-[#d1d6da]"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="w-2/3 bg-[#5bbbae] hover:bg-[#497d76] text-white"
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
