"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wallet, ShieldCheck, ArrowUpRight, ArrowDownLeft, PlusCircle, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { useWallet, formatVnd, WalletTxType } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const TOPUP_PRESETS = [100000, 250000, 500000, 1000000, 2000000];

export default function UserWalletPage() {
  const { availableBalanceVnd, escrowLockedVnd, transactions, topupWallet, isToppingUp } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number>(500000);
  const [txFilter, setTxFilter] = useState<"ALL" | WalletTxType>("ALL");
  const [receiptMsg, setReceiptMsg] = useState<string | null>(null);

  const filteredTx = transactions.filter((t) => (txFilter === "ALL" ? true : t.tx_type === txFilter));

  const handleTopup = async () => {
    if (selectedAmount < 10000) return;
    await topupWallet({ amount_vnd: selectedAmount, payment_method: "MoMo QR" });
    setReceiptMsg(`Đã nạp thành công +${formatVnd(selectedAmount)} vào Số dư khả dụng Ví Belooga!`);
  };

  const renderTxBadge = (type: WalletTxType) => {
    switch (type) {
      case "TOPUP":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">Nạp Tiền Ví</Badge>;
      case "SYSTEM_PURCHASE":
        return <Badge className="bg-teal-50 text-brand-dark border-teal-300 text-[10px]">Mua Gói Hệ Thống</Badge>;
      case "EXPERT_ESCROW_LOCK":
        return <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px]">Tạm Giữ Escrow</Badge>;
      case "EXPERT_ESCROW_RELEASE":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-300 text-[10px]">Giải Ngân Expert</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  return (
    <div data-testid="user-wallet-page" className="min-h-screen bg-surface-page py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-brand-primary" />
              <h1 className="text-2xl font-bold text-typography-main">Ví Điện Tử & Bảo Vệ Escrow Belooga</h1>
              <Badge variant="teal" className="text-[10px]">100% Escrow Protected</Badge>
            </div>
            <p className="text-xs text-typography-body mt-1">
              Quản lý số dư thanh toán tức thì cho ATS AI Tailor và bảo vệ tiền ký quỹ Escrow khi đặt lịch chuyên gia chấm CV.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/ats-diagnostics">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 border-surface-border">
                <Sparkles className="w-3.5 h-3.5 text-brand-primary" /> Quét & Tối Ưu ATS
              </Button>
            </Link>
            <Link href="/expert-review">
              <Button size="sm" className="bg-brand-primary hover:bg-brand-hover text-white text-xs gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Đặt Chuyên Gia Chấm CV
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 bg-surface-card border border-surface-border space-y-1.5">
            <div className="text-xs text-typography-muted font-medium flex items-center justify-between">
              <span>Số Dư Khả Dụng</span>
              <Wallet className="w-4 h-4 text-brand-primary" />
            </div>
            <div data-testid="wallet-available-balance" className="text-2xl font-extrabold text-brand-primary font-mono">
              {formatVnd(availableBalanceVnd)}
            </div>
            <p className="text-[11px] text-typography-muted">Sẵn sàng thanh toán 1-Click không cần chờ quét QR</p>
          </Card>

          <Card className="p-5 bg-surface-card border border-surface-border space-y-1.5">
            <div className="text-xs text-typography-muted font-medium flex items-center justify-between">
              <span>Số Dư Đang Tạm Giữ Escrow</span>
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
            <div data-testid="wallet-escrow-balance" className="text-2xl font-extrabold text-amber-700 font-mono">
              {formatVnd(escrowLockedVnd)}
            </div>
            <p className="text-[11px] text-typography-muted">Chỉ giải ngân cho Expert sau khi bạn nghiệm thu báo cáo CV</p>
          </Card>

          <Card className="p-5 bg-teal-50/50 border border-teal-200 space-y-1.5">
            <div className="text-xs text-brand-dark font-semibold flex items-center justify-between">
              <span>Tổng Tài Sản Ví Bảo Đảm</span>
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="text-2xl font-extrabold text-typography-main font-mono">
              {formatVnd(availableBalanceVnd + escrowLockedVnd)}
            </div>
            <p className="text-[11px] text-brand-dark">Cam kết hoàn tiền 100% nếu quá hạn SLA 48 giờ</p>
          </Card>
        </div>

        <Card data-testid="wallet-topup-panel" className="p-5 bg-surface-card border border-surface-border space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-typography-main flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-brand-primary" />
                <span>Nạp Tiền Nhanh Vào Ví Belooga (MoMo QR / VietQR)</span>
              </h2>
              <p className="text-xs text-typography-muted">Chọn mệnh giá nạp hoặc nhập số tiền tùy chỉnh để cộng ngay vào số dư ví.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TOPUP_PRESETS.map((amt) => (
              <button
                key={amt}
                type="button"
                data-testid={`wallet-topup-preset-${amt}`}
                onClick={() => setSelectedAmount(amt)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  selectedAmount === amt
                    ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                    : "bg-surface-page text-typography-heading border-surface-border hover:border-brand-primary"
                }`}
              >
                +{formatVnd(amt)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              data-testid="wallet-topup-input"
              min={10000}
              step={10000}
              value={selectedAmount}
              onChange={(e) => setSelectedAmount(Math.max(0, Number(e.target.value)))}
              className="w-48 rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-xs font-mono text-typography-main focus:outline-none focus:border-brand-primary"
            />
            <Button
              type="button"
              data-testid="btn-wallet-topup"
              disabled={isToppingUp || selectedAmount < 10000}
              onClick={handleTopup}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold px-4 h-9 rounded-lg gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isToppingUp ? "Đang cộng số dư..." : `Nạp Ngay +${formatVnd(selectedAmount)}`}</span>
            </Button>
          </div>

          {receiptMsg && (
            <div data-testid="wallet-topup-receipt" className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{receiptMsg}</span>
            </div>
          )}
        </Card>

        <Card data-testid="wallet-transactions-table" className="p-5 bg-surface-card border border-surface-border space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-divider pb-3">
            <h3 className="text-sm font-bold text-typography-main uppercase tracking-wider">
              Lịch Sử Biến Động Số Dư & Giao Dịch Escrow ({filteredTx.length})
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {(["ALL", "TOPUP", "SYSTEM_PURCHASE", "EXPERT_ESCROW_LOCK", "EXPERT_ESCROW_RELEASE"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTxFilter(f)}
                  className={`px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                    txFilter === f ? "bg-brand-primary text-white border-brand-primary font-semibold" : "bg-surface-page text-typography-muted border-surface-border"
                  }`}
                >
                  {f === "ALL" ? "Mọi GD" : f === "TOPUP" ? "Nạp tiền" : f === "SYSTEM_PURCHASE" ? "Mua gói" : f === "EXPERT_ESCROW_LOCK" ? "Khóa Escrow" : "Giải ngân"}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-surface-divider text-xs">
            {filteredTx.map((tx) => {
              const isCredit = tx.tx_type === "TOPUP" || tx.tx_type === "REFUND";
              return (
                <div key={tx.id} data-testid={`wallet-tx-row-${tx.id}`} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className={`p-1.5 rounded-lg ${isCredit ? "bg-emerald-50 text-emerald-700" : "bg-surface-page text-brand-primary"}`}>
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-typography-main">{tx.description}</span>
                        {renderTxBadge(tx.tx_type)}
                      </div>
                      <div className="text-[11px] text-typography-muted font-mono mt-0.5">
                        Ref: {tx.reference_id || tx.id} · {new Date(tx.created_at).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>
                  <div className={`font-mono font-bold text-sm ${isCredit ? "text-emerald-700" : "text-typography-main"}`}>
                    {isCredit ? `+${formatVnd(tx.amount_vnd)}` : `-${formatVnd(tx.amount_vnd)}`}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
