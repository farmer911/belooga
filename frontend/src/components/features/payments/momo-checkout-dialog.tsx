"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MomoCheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  packageType: "MICRO_PASS_29K" | "MICRO_PASS_59K" | "EXPERT_REVIEW";
  amount: number;
  orderInfo: string;
  onPaymentSuccess?: () => void;
}

export function MomoCheckoutDialog({
  isOpen,
  onClose,
  packageType,
  amount,
  orderInfo,
  onPaymentSuccess,
}: MomoCheckoutDialogProps) {
  const [orderId, setOrderId] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(600); // 10 minutes

  useEffect(() => {
    if (!isOpen) {
      setIsPaid(false);
      setCountdown(600);
      return;
    }

    // Call API to create order & QR
    let isMounted = true;
    async function createOrder() {
      try {
        const res = await axios.post("http://localhost:8000/v1/payments/momo/create-qr", {
          package_type: packageType,
          amount: amount,
          order_info: orderInfo,
        });
        if (isMounted && res.data) {
          setOrderId(res.data.order_id);
          setQrUrl(res.data.qr_code_url);
        }
      } catch {
        // Fallback mock order
        if (isMounted) {
          const mockId = `MOMO-MOCK-${Date.now()}`;
          setOrderId(mockId);
          setQrUrl("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=momo_mock_transfer");
        }
      }
    }
    createOrder();

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isOpen, packageType, amount, orderInfo]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSimulatePayment = async () => {
    try {
      if (orderId) {
        await axios.post("http://localhost:8000/v1/payments/momo/ipn", {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-lg max-w-sm w-full p-5 space-y-4 shadow-2xl relative text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold text-[10px]">
              M
            </span>
            <h3 className="font-bold text-slate-100 uppercase tracking-wider text-xs">
              Thanh Toán MoMo QR Realtime
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {isPaid ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 text-2xl flex items-center justify-center mx-auto">
              ✓
            </div>
            <div className="text-sm font-bold text-slate-100">Thanh Toán Thành Công!</div>
            <div className="text-slate-400 text-[11px]">
              Mã giao dịch: <span className="font-mono text-cyan-400">{orderId}</span>
            </div>
            <p className="text-[10px] text-emerald-400">
              Đã mở khóa tính năng tự động tối ưu form STAR và xuất bản PDF chuẩn A4.
            </p>
            <Button
              onClick={onClose}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs w-full h-8"
            >
              Tiếp Tục Sử Dụng
            </Button>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <div>
              <div className="text-[11px] text-slate-400">{orderInfo}</div>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-0.5">
                {amount.toLocaleString("vi-VN")} đ
              </div>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-lg inline-block mx-auto shadow-inner border border-slate-700">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="MoMo Payment QR"
                  className="w-44 h-44 object-contain"
                  data-testid="momo-qr-image"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-500">
                  Đang sinh mã QR...
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <span>Hết hạn trong:</span>
              <span className="font-mono font-bold text-amber-400">{formatTimer(countdown)}</span>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              Mở ứng dụng MoMo trên điện thoại và quét mã QR ở trên để hoàn tất thanh toán.
            </p>

            <div className="pt-2 space-y-1.5">
              <Button
                data-testid="btn-simulate-momo-pay"
                onClick={handleSimulatePayment}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs h-7"
              >
                ⚡ Giả Lập Quét MoMo Thành Công
              </Button>
              <Button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 text-xs h-7"
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
