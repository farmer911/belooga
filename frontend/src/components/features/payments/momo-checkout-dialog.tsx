"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, Wallet, PlusCircle, CheckCircle2, X } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useWallet, formatVnd } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";

interface MomoCheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  packageType: "MICRO_PASS_29K" | "MICRO_PASS_59K" | "EXPERT_REVIEW";
  amount: number;
  orderInfo: string;
  onPaymentSuccess?: () => void;
}

interface MomoQrResponse {
  order_id: string;
  qr_code_url: string;
}

export function MomoCheckoutDialog({
  isOpen,
  onClose,
  packageType,
  amount,
  orderInfo,
  onPaymentSuccess,
}: MomoCheckoutDialogProps) {
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [paidMethodLabel, setPaidMethodLabel] = useState<string>("MoMo QR");
  const [countdown, setCountdown] = useState<number>(600);
  const { availableBalanceVnd, payWithWallet, isPayingWithWallet, topupWallet, isToppingUp } = useWallet();

  const { data: qrData } = useQuery<MomoQrResponse>({
    queryKey: ["momo-qr", packageType, amount, orderInfo],
    queryFn: async () =>
      (await apiClient.post<MomoQrResponse>("/v1/payments/momo/create-qr", {
        package_type: packageType,
        amount,
        order_info: orderInfo,
      })).data,
    enabled: isOpen,
  });

  const orderId = qrData?.order_id ?? `ORD-${Date.now()}`;
  const qrUrl = qrData?.qr_code_url ?? "";

  const { data: orderStatusData } = useQuery<{ order_id: string; status: string }>({
    queryKey: ["momo-order-status", orderId],
    queryFn: async () =>
      (await apiClient.get<{ order_id: string; status: string }>(`/v1/payments/momo/order-status/${orderId}`)).data,
    enabled: isOpen && Boolean(qrData?.order_id) && !isPaid,
    refetchInterval: isOpen && Boolean(qrData?.order_id) && !isPaid ? 3000 : false,
  });

  useEffect(() => {
    if (orderStatusData?.status === "PAID" && !isPaid) {
      setIsPaid(true);
      if (onPaymentSuccess) onPaymentSuccess();
    }
  }, [orderStatusData?.status, isPaid, onPaymentSuccess]);

  useEffect(() => {
    if (!isOpen) {
      setIsPaid(false);
      setCountdown(600);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleWalletPay = async () => {
    await payWithWallet({
      amount_vnd: amount,
      target_type: packageType === "EXPERT_REVIEW" ? "EXPERT_ESCROW_LOCK" : "SYSTEM_PURCHASE",
      order_id: orderId,
      description: orderInfo,
    });
    setPaidMethodLabel("Số Dư Ví Belooga");
    setIsPaid(true);
    if (onPaymentSuccess) onPaymentSuccess();
  };

  const handleSimulatePayment = async () => {
    try {
      if (qrData?.order_id) {
        await apiClient.post("/v1/payments/momo/ipn", {
          order_id: qrData.order_id,
          trans_id: `MOMO_SIM_${Date.now()}`,
          result_code: 0,
          signature: "valid_sim_sig",
          amount,
        });
      }
    } catch {
      // Fallback
    }
    setPaidMethodLabel("MoMo QR Realtime");
    setIsPaid(true);
    if (onPaymentSuccess) onPaymentSuccess();
  };

  const hasEnoughBalance = availableBalanceVnd >= amount;

  return (
    <div
      data-testid="momo-checkout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="bg-surface-card border border-surface-border rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl relative text-xs">
        <div className="flex items-center justify-between border-b border-surface-divider pb-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-pink-700 flex items-center justify-center text-white font-bold text-[10px]">
              M
            </span>
            <h3 className="font-bold text-typography-main uppercase tracking-wider text-xs">
              Thanh Toán MoMo QR Realtime & Ví Belooga
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment modal"
            className="text-typography-muted hover:text-typography-main cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isPaid ? (
          <div data-testid="payment-success-receipt" className="py-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-typography-main">Biên Lai Thanh Toán Thành Công!</div>
            <div className="text-typography-muted text-[11px] space-y-0.5">
              <div>Mã giao dịch: <span className="font-mono text-brand-primary font-semibold">{orderId}</span></div>
              <div>Phương thức: <strong className="text-typography-main">{paidMethodLabel}</strong> · Số tiền: <strong className="text-emerald-700">{formatVnd(amount)}</strong></div>
            </div>
            <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
              Đã mở khóa tính năng tự động tối ưu form STAR và chèn từ khóa JD còn thiếu!
            </p>
            <Button
              onClick={onClose}
              className="bg-brand-primary hover:bg-brand-hover text-white font-medium text-xs w-full h-8 rounded-lg shadow-xs"
            >
              Tiếp Tục Sử Dụng
            </Button>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <div>
              <div className="text-[11px] text-typography-muted">{orderInfo}</div>
              <div className="text-2xl font-bold font-mono text-pink-700 mt-0.5">
                {amount.toLocaleString("vi-VN")} đ
              </div>
            </div>

            <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-dark flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-brand-primary" /> Số dư Ví Belooga:
                </span>
                <span data-testid="modal-wallet-balance" className="font-mono font-bold text-brand-primary">
                  {formatVnd(availableBalanceVnd)}
                </span>
              </div>
              {hasEnoughBalance ? (
                <Button
                  type="button"
                  data-testid="btn-pay-with-wallet"
                  disabled={isPayingWithWallet}
                  onClick={handleWalletPay}
                  className="w-full bg-brand-primary hover:bg-brand-hover text-white font-semibold text-xs h-8 rounded-lg gap-1.5"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{isPayingWithWallet ? "Đang trừ ví & tối ưu CV..." : `Thanh Toán Ngay Bằng Ví (-${formatVnd(amount)})`}</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  data-testid="btn-quick-topup-wallet"
                  disabled={isToppingUp}
                  onClick={() => topupWallet({ amount_vnd: Math.max(200000, amount - availableBalanceVnd + 100000), payment_method: "MoMo QR" })}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-8 rounded-lg gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isToppingUp ? "Đang nạp thêm..." : "Số dư không đủ — Nạp Thêm Ngay +200.000 đ"}</span>
                </Button>
              )}
            </div>

            <div className="p-3 bg-surface-card rounded-xl inline-block mx-auto shadow-sm border border-surface-border">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="MoMo Payment QR" className="w-36 h-36 object-contain" data-testid="momo-qr-image" />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-typography-muted">Đang sinh mã QR...</div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-typography-muted">
              <span>Hết hạn trong:</span>
              <span className="font-mono font-bold text-amber-700">{formatTimer(countdown)}</span>
            </div>

            <div className="pt-1 space-y-2">
              <Button
                data-testid="btn-simulate-momo-pay"
                onClick={handleSimulatePayment}
                className="w-full bg-pink-700 hover:bg-pink-800 text-white font-semibold text-xs h-8 rounded-lg shadow-xs transition-colors gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Giả Lập Quét MoMo Thành Công</span>
              </Button>
              <Button
                onClick={onClose}
                className="w-full bg-surface-card hover:bg-surface-page text-typography-heading hover:text-typography-main border border-surface-border text-xs h-8 rounded-lg shadow-xs transition-colors"
              >
                Hủy Giao Dịch
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
