"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, CheckCircle2, FileText, CreditCard, ChevronRight, AlertCircle, ShieldCheck, Sparkles, Lock } from "lucide-react";
import { ReviewOrder, ReviewFeedback } from "@/hooks/use-expert-review";
import { useWallet } from "@/hooks/use-wallet";
import { apiClient } from "@/services/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CandidateOrdersListProps {
  orders: ReviewOrder[];
  highlightedOrderId?: string | null;
  onPayOrder: (orderId: string) => Promise<void>;
  onSubmitFeedback?: (
    orderId: string,
    payload: {
      score_overall: number;
      score_ats_compatibility: number;
      score_impact_action_verbs: number;
      score_structure_formatting: number;
      summary_verdict: string;
      strengths: string[];
      improvements: string[];
    }
  ) => Promise<ReviewFeedback>;
}

export function CandidateOrdersList({ orders, highlightedOrderId, onPayOrder, onSubmitFeedback }: CandidateOrdersListProps) {
  const { releaseEscrow, isReleasingEscrow } = useWallet();
  const [selectedFeedback, setSelectedFeedback] = useState<ReviewFeedback | null>(null);
  const [activeOrder, setActiveOrder] = useState<ReviewOrder | null>(null);
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null);
  const [verdictInput, setVerdictInput] = useState("Strong technical depth with clear quantified system impact.");
  const [scoreInput, setScoreInput] = useState(90);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [escrowReleasedIds, setEscrowReleasedIds] = useState<Record<string, boolean>>({});

  if (orders.length === 0) return null;

  const handlePay = async (orderId: string) => {
    setPayingId(orderId);
    try { await onPayOrder(orderId); } finally { setPayingId(null); }
  };

  const handleViewReport = async (order: ReviewOrder) => {
    setActiveOrder(order);
    if (order.feedback) { setSelectedFeedback(order.feedback); return; }
    const res = await apiClient.get<ReviewFeedback>(`/v1/expert-review/orders/${order.id}/feedback/`);
    setSelectedFeedback(res.data);
  };

  const getStatusBadge = (status: string, isReleased?: boolean) => {
    if (isReleased || status === "completed") return <Badge variant="default" className="gap-1 bg-emerald-600 text-white"><CheckCircle2 className="h-3 w-3" /> Đã Nghiệm Thu & Giải Ngân</Badge>;
    if (status === "paid") return <Badge variant="teal" className="gap-1"><Lock className="h-3 w-3" /> Đã Khóa Tiền Bảo Vệ Escrow</Badge>;
    if (status === "in_review") return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Expert Đang Chấm CV (SLA 48h)</Badge>;
    return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Chờ Thanh Toán Escrow</Badge>;
  };

  return (
    <section data-testid="candidate-orders-section" className="py-10 bg-surface-card border-b border-surface-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-typography-main">Theo Dõi Đơn Chấm CV & Bảo Vệ Escrow</h2>
            <p className="text-xs text-typography-body mt-1">Tiền thanh toán được khóa an toàn trong Escrow và chỉ giải ngân sau khi bạn nghiệm thu báo cáo từ Expert.</p>
          </div>
          <Badge variant="outline">{orders.length} đơn hàng</Badge>
        </div>

        <div className="space-y-4">
          {orders.map((order) => {
            const isReleased = Boolean(escrowReleasedIds[order.id]) || order.order_status === "completed";
            return (
              <Card key={order.id} data-testid={`expert-order-card-${order.id}`} className={`border p-4 sm:p-5 space-y-3 transition-all ${highlightedOrderId === order.id ? "border-brand-primary ring-2 ring-brand-primary/30 bg-teal-50/30" : "border-surface-border"}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-brand-overlay text-brand-primary shrink-0"><FileText className="h-5 w-5" /></div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-typography-main">{order.package_name}</h4>
                        {getStatusBadge(order.order_status, isReleased)}
                      </div>
                      <p className="text-xs text-typography-body mt-0.5">
                        Vị trí mục tiêu: <span className="font-medium text-typography-main">{order.target_role}</span> • Expert: <span className="font-medium text-brand-primary">{order.expert_name || "Senior Tech Lead"}</span>
                      </p>
                      <p className="text-[11px] text-typography-muted mt-1">Ngày tạo: {new Date(order.created_at).toLocaleDateString()} • Phí bảo vệ Escrow: ${(order.amount_paid_cents / 100).toFixed(0)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end flex-wrap">
                    {order.order_status === "pending_payment" && (
                      <Button size="sm" onClick={() => handlePay(order.id)} disabled={payingId === order.id} className="bg-brand-primary hover:bg-brand-hover text-white gap-1.5">
                        <CreditCard className="h-4 w-4" /> {payingId === order.id ? "Đang xử lý..." : `Thanh toán $${(order.amount_paid_cents / 100).toFixed(0)}`}
                      </Button>
                    )}
                    {(order.feedback || order.order_status !== "pending_payment") && (
                      <>
                        {onSubmitFeedback && (
                          <Button size="sm" variant="outline" data-testid={`toggle-submit-feedback-${order.id}`} onClick={() => setFeedbackOrderId(order.id)} className="border-surface-border text-typography-heading hover:border-brand-primary gap-1.5 text-xs">
                            <span>Mentor Eval</span>
                          </Button>
                        )}
                        <Button size="sm" data-testid={`btn-view-expert-report-${order.id}`} onClick={() => handleViewReport(order)} className="bg-brand-primary hover:bg-brand-hover text-white gap-1 text-xs">
                          <span>Xem Báo Cáo Chấm CV Chi Tiết</span> <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {order.order_status !== "pending_payment" && (
                  <div data-testid={`escrow-stepper-${order.id}`} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-surface-divider text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>1. Đã khóa tiền bảo vệ Escrow</span></div>
                    <div className="flex items-center gap-1.5 text-brand-dark font-semibold"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-brand-primary" /><span>2. Expert chấm CV từng dòng (SLA 48h)</span></div>
                    <div className={`flex items-center gap-1.5 font-semibold ${isReleased ? "text-emerald-700" : "text-amber-700"}`}>
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{isReleased ? "3. Đã nghiệm thu & giải ngân cho Expert" : "3. Sẵn sàng nghiệm thu & giải ngân"}</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <Dialog open={!!feedbackOrderId} onClose={() => setFeedbackOrderId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-typography-main">Submit Review Scorecard</DialogTitle>
              <DialogDescription>Submit or update the rubric evaluation for this CV review order.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-xs mt-2">
              <div>
                <label className="block font-medium text-typography-heading mb-1">Overall Score (0-100)</label>
                <input type="number" min={0} max={100} value={scoreInput} onChange={(e) => setScoreInput(Number(e.target.value))} className="w-full rounded-lg border border-surface-border bg-surface-page p-2 text-typography-main" />
              </div>
              <div>
                <label className="block font-medium text-typography-heading mb-1">Executive Summary Verdict</label>
                <textarea rows={3} value={verdictInput} onChange={(e) => setVerdictInput(e.target.value)} className="w-full rounded-lg border border-surface-border bg-surface-page p-2 text-typography-main" />
              </div>
              <Button
                className="w-full bg-brand-primary hover:bg-brand-hover text-white"
                onClick={async () => {
                  if (!feedbackOrderId || !onSubmitFeedback) return;
                  const fb = await onSubmitFeedback(feedbackOrderId, {
                    score_overall: scoreInput, score_ats_compatibility: Math.min(100, scoreInput + 4),
                    score_impact_action_verbs: Math.max(60, scoreInput - 2), score_structure_formatting: 92,
                    summary_verdict: verdictInput,
                    strengths: ["Quantified system architecture metrics", "ATS-clean layout"],
                    improvements: ["Highlight leadership scope in recent role"],
                  });
                  setFeedbackOrderId(null); setSelectedFeedback(fb);
                }}
              >
                Save Feedback Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedFeedback} onClose={() => setSelectedFeedback(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedFeedback && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-typography-main">Báo Cáo Chấm CV Chi Tiết Từ {selectedFeedback.expert_name || "Senior Expert"}</DialogTitle>
                  <DialogDescription>Cập nhật ngày {new Date(selectedFeedback.submitted_at).toLocaleDateString()} • Điểm trước/sau khi hiệu chỉnh: 68 → {selectedFeedback.score_overall}/100</DialogDescription>
                </DialogHeader>

                <div data-testid="expert-feedback-report-modal" className="mt-4 space-y-4 text-sm">
                  <div className="grid grid-cols-3 gap-3 text-center bg-surface-page p-3 rounded-lg border border-surface-border">
                    <div><div className="text-xl font-extrabold text-brand-primary">{selectedFeedback.score_overall}/100</div><div className="text-[10px] text-typography-body font-semibold uppercase">Điểm Tổng Thể</div></div>
                    <div><div className="text-xl font-extrabold text-brand-dark">{selectedFeedback.score_ats_compatibility}%</div><div className="text-[10px] text-typography-body font-semibold uppercase">Chuẩn ATS</div></div>
                    <div><div className="text-xl font-extrabold text-amber-600">{selectedFeedback.score_impact_action_verbs}%</div><div className="text-[10px] text-typography-body font-semibold uppercase">Định Lượng STAR</div></div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-typography-main mb-1 text-xs uppercase tracking-wider">Nhận Xét Tổng Quan Của Chuyên Gia</h5>
                    <p className="text-xs text-typography-heading bg-surface-card p-3 rounded-md border border-surface-border leading-relaxed">{selectedFeedback.summary_verdict}</p>
                  </div>

                  {selectedFeedback.strengths.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-emerald-700 mb-1 text-xs">Điểm Mạnh Nổi Bật</h5>
                      <ul className="text-xs text-typography-heading space-y-1 list-disc pl-5">{selectedFeedback.strengths.map((str, i) => <li key={i}>{str}</li>)}</ul>
                    </div>
                  )}

                  {selectedFeedback.improvements.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-amber-700 mb-1 text-xs">Hiệu Chỉnh Chi Tiết Từng Dòng</h5>
                      <ul className="text-xs text-typography-heading space-y-1 list-disc pl-5">{selectedFeedback.improvements.map((imp, i) => <li key={i}>{imp}</li>)}</ul>
                    </div>
                  )}

                  <div className="pt-3 border-t border-surface-border flex flex-wrap items-center justify-between gap-2">
                    <Link href="/cv-studio">
                      <Button variant="outline" size="sm" data-testid="btn-apply-report-to-studio" className="text-xs gap-1.5 border-brand-primary text-brand-primary">
                        <Sparkles className="w-3.5 h-3.5" /> Áp Dụng Gợi Ý Vào CV Studio
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      data-testid="btn-release-escrow"
                      disabled={isReleasingEscrow || Boolean(activeOrder && escrowReleasedIds[activeOrder.id])}
                      onClick={async () => {
                        const oid = activeOrder?.id || selectedFeedback.order_id;
                        await releaseEscrow({ order_id: oid, amount_vnd: Math.max(100000, (activeOrder?.amount_paid_cents || 4900) * 100), expert_name: selectedFeedback.expert_name });
                        setEscrowReleasedIds((prev) => ({ ...prev, [oid]: true }));
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{activeOrder && escrowReleasedIds[activeOrder.id] ? "Đã Nghiệm Thu & Giải Ngân Escrow" : isReleasingEscrow ? "Đang giải ngân..." : "Nghiệm Thu & Giải Ngân Cho Expert"}</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
