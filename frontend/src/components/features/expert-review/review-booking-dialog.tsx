"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CreditCard, Loader2, QrCode, Upload, CheckCircle2, Wallet } from "lucide-react";
import { ReviewPackage, ExpertProfile, ReviewOrder } from "@/hooks/use-expert-review";
import { useWallet, formatVnd } from "@/hooks/use-wallet";
import { apiClient, getApiErrorDetail } from "@/services/api-client";
import { uploadResume } from "@/services/media-upload.service";
import { extractCvFileContent } from "@/lib/cv-file-parser";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FormField } from "@/components/common/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { reviewBookingSchema, ReviewBookingFormValues } from "@/lib/schemas";
import Image from "next/image";
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
  onCheckout: (orderId: string, paymentMethod?: string) => Promise<unknown>;
}

export function ReviewBookingDialog({
  open, onOpenChange, selectedPackage, selectedExpert, packages, onSubmitOrder, onCheckout,
}: ReviewBookingDialogProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { availableBalanceVnd, payWithWallet, topupWallet, isToppingUp } = useWallet();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"details" | "payment">("details");
  const activePackageSlug = selectedPackage?.slug || (packages[0]?.slug ?? "pro");
  const [resumeUrl, setResumeUrl] = useState<string>("/uploads/resumes/candidate_cv.pdf");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "momo_qr" | "card">("wallet");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedCvInfo, setExtractedCvInfo] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ReviewBookingFormValues>({
    resolver: zodResolver(reviewBookingSchema),
    defaultValues: { targetRole: "Senior Fullstack Engineer", targetCompanies: "Google, Stripe, Scale AI", candidateNotes: "" },
  });

  const currentPkg = packages.find((p) => p.slug === activePackageSlug) || packages[0];

  const uploadResumeMutation = useMutation({
    mutationFn: async (file: File) => {
      const activeUser = user?.username || "";
      const [uploadRes, parsed] = await Promise.allSettled([
        activeUser ? uploadResume(file, activeUser) : Promise.reject(new Error("unauthenticated")),
        extractCvFileContent(file, activeUser || undefined),
      ]);
      const url = uploadRes.status === "fulfilled" && uploadRes.value?.resume_url
        ? uploadRes.value.resume_url
        : `/uploads/resumes/${encodeURIComponent(file.name)}`;
      const text = parsed.status === "fulfilled" ? parsed.value.text : "";
      return { resume_url: url, extracted_text: text, file_name: file.name };
    },
    onSuccess: (res) => {
      if (res.resume_url) setResumeUrl(res.resume_url);
      if (res.extracted_text) setExtractedCvInfo(`Đã trích xuất ${res.extracted_text.length} ký tự từ ${res.file_name}`);
    },
  });

  const momoQrMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.post<{ order_id: string; qr_code_url: string }>("/v1/payments/momo/create-qr", {
        package_type: "EXPERT_REVIEW",
        amount: Math.max(10000, (currentPkg?.price_cents || 4900) * 250),
        order_info: currentPkg?.name || "Expert CV Review",
      })).data,
  });

  const handleNextToPayment = handleSubmit(async (values) => {
    if (!isAuthenticated) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const order = await onSubmitOrder({
        package_slug: activePackageSlug,
        expert_id: selectedExpert?.id,
        resume_url: resumeUrl.trim() || "/uploads/resumes/candidate_cv.pdf",
        target_role: values.targetRole,
        target_companies: values.targetCompanies,
        candidate_notes: values.candidateNotes,
      });
      setCreatedOrderId(order.id);
      setStep("payment");
      momoQrMutation.mutate();
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
    const vndAmount = Math.max(100000, (currentPkg?.price_cents || 4900) * 100);
    try {
      if (paymentMethod === "wallet") {
        await payWithWallet({
          amount_vnd: vndAmount,
          target_type: "EXPERT_ESCROW_LOCK",
          order_id: createdOrderId,
          description: `Tạm giữ Escrow đơn chấm CV: ${currentPkg?.name || "Expert Review"}`,
        });
      }
      await onCheckout(createdOrderId, paymentMethod);
      onOpenChange(false);
      setStep("details");
      setCreatedOrderId(null);
      setTimeout(() => {
        document.querySelector('[data-testid="candidate-orders-section"]')?.scrollIntoView({ behavior: "smooth" });
      }, 150);
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
              : "Review your order summary and select a payment method."}
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-typography-heading">Please login or create a candidate account to order an expert CV review.</p>
            <div className="flex justify-center gap-3">
              <Link
                href="/login"
                onClick={(e) => {
                  if (typeof window !== "undefined" && "sessionStorage" in window) {
                    try {
                      window.sessionStorage.setItem("belooga_return_to", "/expert-review");
                    } catch (err: unknown) {
                      e.preventDefault();
                      setErrorMsg(getApiErrorDetail(err, "Trình duyệt chặn sessionStorage; chuyển hướng qua URL return_to."));
                      window.location.assign("/login?return_to=%2Fexpert-review");
                    }
                  }
                }}
              >
                <Button variant="outline" className="border-brand-primary text-brand-primary">Login to Continue</Button>
              </Link>
              <Link href="/register"><Button className="bg-brand-primary text-white">Register</Button></Link>
            </div>
          </div>
        ) : step === "details" ? (
          <form onSubmit={handleNextToPayment} noValidate className="space-y-4 py-2">
            {errorMsg && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{errorMsg}</div>}
            <Card className="p-3.5 bg-surface-page border border-surface-border flex items-center justify-between">
              <div>
                <div className="text-xs text-typography-muted">Selected Review Package:</div>
                <div className="text-sm font-bold text-typography-main">{currentPkg?.name} (${(currentPkg?.price_cents ?? 0) / 100})</div>
                {selectedExpert && <div className="text-xs text-brand-primary mt-0.5">Reviewer: {selectedExpert.full_name} ({selectedExpert.company})</div>}
              </div>
              <Badge variant="outline" className="text-xs">{currentPkg?.turn_around_hours}h Turnaround</Badge>
            </Card>

            <FormField label="Resume / CV File (.pdf, .docx, .doc)" required>
              <div className="flex items-center gap-2">
                <Input value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="/uploads/resumes/candidate_cv.pdf" />
                <input ref={fileInputRef} data-testid="expert-booking-cv-input" type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadResumeMutation.mutate(f); e.target.value = ""; }} className="hidden" />
                <Button type="button" data-testid="expert-booking-upload-btn" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadResumeMutation.isPending} className="shrink-0 border-surface-border text-xs gap-1">
                  <Upload className="h-3.5 w-3.5" /> {uploadResumeMutation.isPending ? "Uploading..." : "Upload CV"}
                </Button>
              </div>
              {extractedCvInfo && (
                <div data-testid="booking-cv-extracted-preview" className="mt-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{extractedCvInfo}</span>
                </div>
              )}
            </FormField>

            <FormField label="Target Role / Job Title" required error={errors.targetRole?.message}>
              <Input placeholder="e.g. Senior Backend Engineer" {...register("targetRole")} />
            </FormField>
            <FormField label="Target Companies or Industry" error={errors.targetCompanies?.message}>
              <Input placeholder="e.g. Stripe, OpenAI, FinTech startups" {...register("targetCompanies")} />
            </FormField>
            <FormField label="Specific Questions for the Reviewer" error={errors.candidateNotes?.message}>
              <Textarea placeholder="e.g. Is my work experience described with enough quantitative impact?" {...register("candidateNotes")} />
            </FormField>

            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-brand-primary hover:bg-brand-hover text-white">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Proceed to Payment (${((currentPkg?.price_cents || 0) / 100).toFixed(0)})
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 py-2">
            {errorMsg && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{errorMsg}</div>}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-typography-main">Phương thức thanh toán (Escrow Bảo Đảm)</span>
                <span className="font-mono text-brand-primary font-bold">Số dư ví: {formatVnd(availableBalanceVnd)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" data-testid="select-pay-wallet" onClick={() => setPaymentMethod("wallet")} className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-1.5 ${paymentMethod === "wallet" ? "border-brand-primary bg-teal-50/50 text-brand-dark font-semibold" : "border-surface-border bg-surface-card text-typography-heading"}`}>
                  <Wallet className="h-4 w-4 text-brand-primary shrink-0" />
                  <span className="text-xs">Số Dư Ví</span>
                </button>
                <button type="button" data-testid="select-pay-momo" onClick={() => { setPaymentMethod("momo_qr"); if (!momoQrMutation.data) momoQrMutation.mutate(); }} className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-1.5 ${paymentMethod === "momo_qr" ? "border-brand-primary bg-teal-50/50 text-brand-dark font-semibold" : "border-surface-border bg-surface-card text-typography-heading"}`}>
                  <QrCode className="h-4 w-4 text-brand-primary shrink-0" />
                  <span className="text-xs">MoMo QR</span>
                </button>
                <button type="button" data-testid="select-pay-card" onClick={() => setPaymentMethod("card")} className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-1.5 ${paymentMethod === "card" ? "border-brand-primary bg-teal-50/50 text-brand-dark font-semibold" : "border-surface-border bg-surface-card text-typography-heading"}`}>
                  <CreditCard className="h-4 w-4 text-brand-primary shrink-0" />
                  <span className="text-xs">Thẻ Quốc Tế</span>
                </button>
              </div>
              {paymentMethod === "wallet" && availableBalanceVnd < Math.max(100000, (currentPkg?.price_cents || 4900) * 100) && (
                <Button type="button" size="sm" variant="outline" disabled={isToppingUp} onClick={() => topupWallet({ amount_vnd: 1000000, payment_method: "MoMo QR" })} className="w-full text-xs border-amber-300 text-amber-800 bg-amber-50">
                  {isToppingUp ? "Đang nạp thêm..." : "Số dư ví chưa đủ — Bấm Nạp Nhanh +1.000.000 đ"}
                </Button>
              )}
            </div>

            {paymentMethod === "momo_qr" && (
              <div className="p-3 rounded-xl bg-surface-page border border-surface-border text-center space-y-1.5">
                {momoQrMutation.data?.qr_code_url ? (
                  <Image unoptimized width={128} height={128} src={momoQrMutation.data.qr_code_url} alt="MoMo QR" className="w-32 h-32 object-contain mx-auto rounded bg-surface-card p-1 border border-surface-border" />
                ) : (
                  <div className="text-xs text-typography-muted py-4">Đang tạo mã QR MoMo Escrow...</div>
                )}
                <div className="text-[11px] text-typography-muted">Quét mã VietQR / MoMo để ký quỹ bảo đảm hoàn tiền 100%</div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("details")} className="w-1/3 border-surface-border">Back</Button>
              <Button onClick={handleConfirmPayment} disabled={isSubmitting} className="w-2/3 bg-brand-primary hover:bg-brand-hover text-white">
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
