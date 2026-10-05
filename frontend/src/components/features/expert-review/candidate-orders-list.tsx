"use client";

import { useState } from "react";
import { Clock, CheckCircle2, FileText, CreditCard, ChevronRight, AlertCircle } from "lucide-react";
import { ReviewOrder, ReviewFeedback } from "@/hooks/use-expert-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CandidateOrdersListProps {
  orders: ReviewOrder[];
  onPayOrder: (orderId: string) => Promise<void>;
}

export function CandidateOrdersList({ orders, onPayOrder }: CandidateOrdersListProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<ReviewFeedback | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  if (orders.length === 0) return null;

  const handlePay = async (orderId: string) => {
    setPayingId(orderId);
    try {
      await onPayOrder(orderId);
    } finally {
      setPayingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="teal" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Paid (Queued)</Badge>;
      case "in_review":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> In Review</Badge>;
      case "completed":
        return <Badge variant="default" className="gap-1 bg-emerald-600 text-white"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
      default:
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Awaiting Payment</Badge>;
    }
  };

  return (
    <section className="py-12 bg-white border-b border-[#e5e9eb]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#252525]">Your CV Review Requests</h2>
            <p className="text-xs text-[#666666] mt-1">
              Track real-time progress and review reports from your assigned experts.
            </p>
          </div>
          <Badge variant="outline">{orders.length} order{orders.length > 1 ? "s" : ""}</Badge>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="border border-[#d1d6da] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-lg bg-[#f0f7f6] text-[#5bbbae] shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-[#252525]">{order.package_name}</h4>
                    {getStatusBadge(order.order_status)}
                  </div>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Target: <span className="font-medium text-[#252525]">{order.target_role}</span> • Assigned to: <span className="font-medium text-[#5bbbae]">{order.expert_name || "Auto-match"}</span>
                  </p>
                  <p className="text-[11px] text-[#999999] mt-1">
                    Submitted: {new Date(order.created_at).toLocaleDateString()} • Amount: ${(order.amount_paid_cents / 100).toFixed(0)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
                {order.order_status === "pending_payment" && (
                  <Button
                    size="sm"
                    onClick={() => handlePay(order.id)}
                    disabled={payingId === order.id}
                    className="bg-[#5bbbae] hover:bg-[#497d76] text-white gap-1.5"
                  >
                    <CreditCard className="h-4 w-4" />
                    {payingId === order.id ? "Processing..." : "Pay ${(order.amount_paid_cents / 100).toFixed(0)}"}
                  </Button>
                )}

                {order.feedback && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFeedback(order.feedback!)}
                    className="border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae] hover:text-white gap-1"
                  >
                    <span>View Report</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Feedback Viewer Dialog */}
        <Dialog open={!!selectedFeedback} onClose={() => setSelectedFeedback(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedFeedback && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-[#252525]">
                    Review Report from {selectedFeedback.expert_name || "Senior Expert"}
                  </DialogTitle>
                  <DialogDescription>
                    Delivered on {new Date(selectedFeedback.submitted_at).toLocaleDateString()}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-4 text-sm">
                  {/* Metric Chips */}
                  <div className="grid grid-cols-3 gap-3 text-center bg-[#f8fafb] p-3 rounded-lg border border-[#e2e8f0]">
                    <div>
                      <div className="text-xl font-extrabold text-[#5bbbae]">{selectedFeedback.score_overall}/100</div>
                      <div className="text-[10px] text-[#666666] font-semibold uppercase">Overall Score</div>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-[#21655e]">{selectedFeedback.score_ats_compatibility}%</div>
                      <div className="text-[10px] text-[#666666] font-semibold uppercase">ATS Match</div>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-amber-600">{selectedFeedback.score_impact_action_verbs}%</div>
                      <div className="text-[10px] text-[#666666] font-semibold uppercase">Action Verbs</div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-[#252525] mb-1">Executive Verdict</h5>
                    <p className="text-xs text-[#555555] bg-white p-3 rounded-md border border-[#e5e9eb] leading-relaxed">
                      {selectedFeedback.summary_verdict}
                    </p>
                  </div>

                  {selectedFeedback.strengths.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-emerald-700 mb-1">Key Strengths</h5>
                      <ul className="text-xs text-[#555555] space-y-1 list-disc pl-5">
                        {selectedFeedback.strengths.map((str, i) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedFeedback.improvements.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-amber-700 mb-1">Recommended Adjustments</h5>
                      <ul className="text-xs text-[#555555] space-y-1 list-disc pl-5">
                        {selectedFeedback.improvements.map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
