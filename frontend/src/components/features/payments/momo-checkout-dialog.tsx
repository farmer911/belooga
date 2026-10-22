"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { apiClient } from "@/services/api-client";
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
  const [countdown, setCountdown] = useState<number>(600); // 10 minutes

  const { data: qrData } = useQuery<MomoQrResponse>({
    queryKey: ["momo-qr", packageType, amount, orderInfo],
    queryFn: async () => {
      const res = await apiClient.post<MomoQrResponse>("/v1/payments/momo/create-qr", {
        package_type: packageType,
        amount: amount,
        order_info: orderInfo,
      });
      return res.data;
    },
    enabled: isOpen,
  });

  const orderId = qrData?.order_id ?? "";
  const qrUrl = qrData?.qr_code_url ?? "";

  const { data: orderStatusData } = useQuery<{ order_id: string; status: string }>({
    queryKey: ["momo-order-status", orderId],
    queryFn: async () =>
      (await apiClient.get<{ order_id: string; status: string }>(`/v1/payments/momo/order-status/${orderId}`)).data,
    enabled: isOpen && Boolean(orderId) && !isPaid,
    refetchInterval: isOpen && Boolean(orderId) && !isPaid ? 3000 : false,
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

  const handleSimulatePayment = async () => {
    try {
      if (orderId) {
        await apiClient.post("/v1/payments/momo/ipn", {
          order_id: orderId,
          trans_id: `MOMO_SIM_${Date.now()}`,
          result_code: 0,
          signature: "valid_sim_sig",
          amount: amount,
        });
      }
    } catch {
      // Fallback
    }
    setIsPaid(true);
    if (onPaymentSuccess) onPaymentSuccess();
  };

  return (
    <div
      data-testid="momo-checkout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="bg-surface-card border border-surface-border rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl relative text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-divider pb-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-pink-700 flex items-center justify-center text-white font-bold text-[10px]">
              M
            </span>
            <h3 className="font-bold text-typography-main uppercase tracking-wider text-xs">
              Thanh Toán MoMo QR Realtime
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-typography-muted hover:text-typography-main text-base font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {isPaid ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 text-2xl flex items-center justify-center mx-auto">
              ✓
            </div>
            <div className="text-sm font-bold text-typography-main">Thanh Toán Thành Công!</div>
            <div className="text-typography-muted text-[11px]">
              Mã giao dịch: <span className="font-mono text-brand-primary font-semibold">{orderId}</span>
            </div>
            <p className="text-[10px] text-emerald-700">
              Đã mở khóa tính năng tự động tối ưu form STAR và xuất bản PDF chuẩn A4.
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

            {/* QR Code Container */}
            <div className="p-3 bg-surface-card rounded-xl inline-block mx-auto shadow-sm border border-surface-border">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="MoMo Payment QR"
                  className="w-44 h-44 object-contain"
                  data-testid="momo-qr-image"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-typography-muted">
                  Đang sinh mã QR...
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-typography-muted">
              <span>Hết hạn trong:</span>
              <span className="font-mono font-bold text-amber-700">{formatTimer(countdown)}</span>
            </div>

            <p className="text-[10px] text-typography-muted leading-tight">
              Mở ứng dụng MoMo trên điện thoại và quét mã QR ở trên để hoàn tất thanh toán.
            </p>

            <div className="pt-2 space-y-2">
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
