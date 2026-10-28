"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Video, DollarSign, CalendarCheck2, Calculator, Gift, BellRing, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useWallet, formatVnd } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";

interface ExpertMockSlot { id: string; expert_name: string; role: string; topic: string; price_vnd: number; }
interface ReverseBidItem { id: string; username: string; role: string; salary_usd: number; status: string; }
interface WalletRewardItem { id: string; title: string; bonus_vnd: number; }
interface ExpertApiItem { id: string; full_name: string; current_role: string; current_company: string; specialties?: string[]; price_vnd: number; }

const mapReverseBid = (item: Record<string, unknown>, fallbackId: string, fallbackUser = "candidate", fallbackUsd = 3500): ReverseBidItem => ({
  id: String(item.id ?? fallbackId),
  username: String(item.username ?? item.candidate_username ?? fallbackUser),
  role: String(item.role ?? "Senior Software Engineer"),
  salary_usd: Number(item.salary_usd ?? item.offered_salary_usd ?? fallbackUsd),
  status: String(item.status ?? "SENT"),
});

export function ExpertLiveMockBookingCard() {
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const { data: slots = [] } = useQuery<ExpertMockSlot[]>({
    queryKey: ["expert-mock-slots"],
    queryFn: async () => {
      const res = await apiClient.get<ExpertApiItem[]>("/v1/expert-review/experts/");
      return (Array.isArray(res.data) ? res.data : []).map((exp) => ({
        id: exp.id,
        expert_name: exp.full_name,
        role: `${exp.current_role} @ ${exp.current_company}`,
        topic: exp.specialties?.join(", ") || "System Design & Career Coaching",
        price_vnd: exp.price_vnd,
      }));
    },
  });
  const bookMutation = useMutation({
    mutationFn: async (slotId: string) => {
      await apiClient.post("/v1/growth/expert-mock-booking", { slot_id: slotId, expert_name: slotId, slot_label: "1-on-1 Live Mock Interview", price_vnd: 299000 });
      return slotId;
    },
    onSuccess: (slotId) => setBookedSlots((p) => [...p, slotId]),
  });

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div data-testid="growth-expert-mock-booking-card" className="p-4 rounded-xl bg-surface-page border border-surface-border shadow-xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-sm text-typography-main flex items-center gap-1.5">
            <Video className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>1-on-1 Live Mock Interview Booking with Experts (Bảo Đảm Qua Ví Escrow)</span>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {slots.map((s) => {
            const isBooked = bookedSlots.includes(s.id);
            return (
              <div key={s.id} className="p-3 rounded-lg bg-surface-card border border-surface-border flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-typography-main">{s.expert_name} · {s.role}</div>
                  <div className="text-[11px] text-typography-muted">{s.topic} · Phí Escrow: <strong className="text-emerald-700">{formatVnd(s.price_vnd)}</strong></div>
                </div>
                <Button
                  type="button"
                  data-testid={`expert-mock-book-btn-${s.id}`}
                  disabled={isBooked || bookMutation.isPending}
                  onClick={() => bookMutation.mutate(s.id)}
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3 rounded-lg shrink-0"
                >
                  {isBooked ? "✓ Đã Giữ Lịch 1-1" : "Đặt Lịch Phỏng Vấn 1-1"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function RecruiterReverseBidAndRoiSuite() {
  const queryClient = useQueryClient();
  const [candidateUsername, setCandidateUsername] = useState("");
  const [bidSalaryUsd, setBidSalaryUsd] = useState("3800");
  const [hiresCount, setHiresCount] = useState(5);

  const { data: bids = [] } = useQuery<ReverseBidItem[]>({
    queryKey: ["recruiter-reverse-bids"],
    queryFn: async () => {
      const res = await apiClient.get<{ reverse_bids?: Array<Record<string, unknown>> }>("/v1/growth/hub");
      return (Array.isArray(res.data?.reverse_bids) ? res.data.reverse_bids : []).map((item, idx) => mapReverseBid(item, `bid-${idx}`));
    },
  });

  const submitBidMutation = useMutation({
    mutationFn: async () => {
      const usd = Number(bidSalaryUsd) || 3500;
      const res = await apiClient.post<Record<string, unknown>>("/v1/recruiter/reverse-bids", {
        candidate_username: candidateUsername.trim(),
        offered_salary_usd: usd,
        message: "Reverse offer bid via Belooga Recruiter Hub",
      });
      return mapReverseBid(res.data ?? {}, `bid-${Date.now()}`, candidateUsername.trim(), usd);
    },
    onSuccess: (created) => {
      if (created) {
        queryClient.setQueryData<ReverseBidItem[]>(["recruiter-reverse-bids"], (prev = []) => [created, ...prev]);
      }
      setCandidateUsername("");
      queryClient.invalidateQueries({ queryKey: ["recruiter-reverse-bids"] });
    },
  });

  const agencyFeeSavedUsd = hiresCount * 4200;
  const daysSaved = hiresCount * 14;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
      <div data-testid="growth-reverse-bidding-panel" className="lg:col-span-7 p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-typography-main flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>Recruiter Reverse Offer Bidding (Đấu Giá Săn Top Ứng Viên)</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={candidateUsername}
            onChange={(e) => setCandidateUsername(e.target.value)}
            placeholder="Username ứng viên..."
            className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1 text-xs w-40"
          />
          <input
            type="number"
            value={bidSalaryUsd}
            onChange={(e) => setBidSalaryUsd(e.target.value)}
            placeholder="Mức lương Bid (USD)..."
            className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1 text-xs font-mono w-32"
          />
          <Button
            type="button"
            data-testid="reverse-bid-submit-btn"
            disabled={submitBidMutation.isPending || !candidateUsername.trim()}
            onClick={() => submitBidMutation.mutate()}
            className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-7 px-3 rounded-lg"
          >
            Gửi Reverse Offer Bid
          </Button>
        </div>
        <div className="space-y-1">
          {bids.map((b) => (
            <div key={b.id} className="p-2 rounded bg-surface-page border border-surface-border flex items-center justify-between">
              <span>@{b.username} · {b.role}</span>
              <span className="font-mono font-bold text-emerald-700">${b.salary_usd.toLocaleString("en-US")}/mo ({b.status})</span>
            </div>
          ))}
        </div>
      </div>

      <div data-testid="growth-b2b-roi-calculator" className="lg:col-span-5 p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-typography-main flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>B2B Hiring ROI & Time-to-Hire Calculator</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Số lượng kỹ sư cần tuyển:</span>
          <input
            type="number"
            data-testid="roi-hires-input"
            min={1}
            max={100}
            value={hiresCount}
            onChange={(e) => setHiresCount(Math.max(1, Number(e.target.value) || 1))}
            className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1 text-xs font-mono w-20"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="text-[10px] text-emerald-800">Tiết kiệm phí Headhunt</div>
            <div className="font-mono font-extrabold text-sm text-emerald-700">${agencyFeeSavedUsd.toLocaleString("en-US")}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-page border border-surface-border">
            <div className="text-[10px] text-typography-muted">Rút ngắn Time-to-Hire</div>
            <div className="font-mono font-extrabold text-sm text-brand-primary">-{daysSaved} ngày</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrackerCalendarAndPulseSuite() {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const togglePrep = (id: string) => setCheckedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  return (
    <div className="px-4 py-2.5 border-b border-surface-border bg-surface-card grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
      <div data-testid="growth-interview-calendar-card" className="lg:col-span-6 p-3 rounded-xl bg-surface-page border border-surface-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-typography-main">
          <CalendarCheck2 className="w-4 h-4 text-brand-primary" aria-hidden="true" />
          <span>Interview Calendar & Prep Checklist:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {[{ id: "prep-1", label: "Ôn System Design 10k RPS" }, { id: "prep-2", label: "Chuẩn bị 3 câu chuyện STAR" }].map((item) => (
            <label key={item.id} className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" data-testid={`interview-prep-checkbox-${item.id}`} checked={checkedItems.includes(item.id)} onChange={() => togglePrep(item.id)} />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div data-testid="growth-smart-career-pulse" className="lg:col-span-6 p-3 rounded-xl bg-teal-50/50 border border-teal-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-brand-dark">
          <BellRing className="w-4 h-4 text-brand-primary" aria-hidden="true" />
          <span>Smart Career Pulse: Thông báo vị trí mới khớp ATS từ PostgreSQL</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">Live Alert ON</span>
      </div>
    </div>
  );
}

export function WalletRewardsCashbackCard() {
  const [claimedIds, setClaimedIds] = useState<string[]>([]);

  const { data: rewards = [] } = useQuery<WalletRewardItem[]>({
    queryKey: ["wallet-rewards-list"],
    queryFn: async () => {
      const res = await apiClient.get<Array<{ id: string; name: string; price_vnd: number }>>("/v1/expert-review/packages/");
      return (Array.isArray(res.data) ? res.data : []).map((pkg) => ({
        id: pkg.id,
        title: `Cashback Gói ${pkg.name}`,
        bonus_vnd: Math.max(25000, Math.round((pkg.price_vnd || 250000) * 0.1)),
      }));
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (rew: WalletRewardItem) => {
      await apiClient.post("/v1/growth/claim-reward", { reward_id: rew.id, reward_code: rew.id });
      return rew.id;
    },
    onSuccess: (id) => {
      setClaimedIds((p) => [...p, id]);
    },
  });

  return (
    <div data-testid="growth-wallet-rewards-card" className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-typography-main flex items-center gap-1.5">
          <Gift className="w-4 h-4 text-brand-primary" aria-hidden="true" />
          <span>Career Rewards, Referral Bonus & Wallet Cashback</span>
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rewards.map((rew) => {
          const claimed = claimedIds.includes(rew.id);
          return (
            <div key={rew.id} className="p-3 rounded-lg bg-surface-page border border-surface-border flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-typography-main">{rew.title}</div>
                <div className="text-emerald-700 font-mono font-bold">Thưởng Cashback: +{formatVnd(rew.bonus_vnd)}</div>
              </div>
              <Button
                type="button"
                data-testid={`wallet-claim-reward-btn-${rew.id}`}
                disabled={claimed || claimMutation.isPending}
                onClick={() => claimMutation.mutate(rew)}
                className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3 rounded-lg shrink-0"
              >
                {claimed ? (
                  <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Đã Nhận Thưởng</span>
                ) : (
                  `Nhận +${formatVnd(rew.bonus_vnd)}`
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
