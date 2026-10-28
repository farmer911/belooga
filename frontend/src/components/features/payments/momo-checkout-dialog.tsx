"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Wallet, CheckCircle2, X, ExternalLink } from "lucide-react";
import { apiClient, getApiErrorDetail } from "@/services/api-client";
import { useWallet, formatVnd, MomoPaymentDTO } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";

interface MomoCheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  packageType: "MICRO_PASS_29K" | "MICRO_PASS_59K";
  /** Display price only; the backend decides the charged amount. */
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
  const [paidMethodLabel, setPaidMethodLabel] = useState<string | null>(null);
  const { availableBalanceVnd, payWithWallet, isPayingWithWallet } = useWallet();

  // MoMo payment page opens in a new tab; this dialog polls until the IPN marks the order PAID.
  const momoMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.post<MomoPaymentDTO>("/v1/payments/momo/create-qr", {
        package_type: packageType,
        order_info: orderInfo,
      })).data,
    onSuccess: (data) => {
      window.open(data.pay_url, "_blank", "noopener,noreferrer");
    },
  });
  const momoOrderId = momoMutation.data?.order_id;

  const { data: orderStatus } = useQuery<{ order_id: string; status: "PENDING" | "PAID" | "FAILED" }>({
    queryKey: ["momo-order-status", momoOrderId],
    queryFn: async () => (await apiClient.get(`/v1/payments/momo/order-status/${momoOrderId}`)).data,
    enabled: isOpen && Boolean(momoOrderId) && !paidMethodLabel,
    refetchInterval: (q) => (q.state.data?.status === "PENDING" || !q.state.data ? 3000 : false),
  });

  useEffect(() => {
    if (orderStatus?.status === "PAID" && !paidMethodLabel) {
      setPaidMethodLabel("MoMo");
      onPaymentSuccess?.();
    }
  }, [orderStatus?.status, paidMethodLabel, onPaymentSuccess]);

  const resetMomo = momoMutation.reset;
  useEffect(() => {
    if (!isOpen) {
      setPaidMethodLabel(null);
      resetMomo();
    }
  }, [isOpen, resetMomo]);

  if (!isOpen) return null;

  const handleWalletPay = async () => {
    await payWithWallet({ amount_vnd: amount, target_type: "SYSTEM_PURCHASE", description: orderInfo });
    setPaidMethodLabel("Số Dư Ví Belooga");
    onPaymentSuccess?.();
  };

  const hasEnoughBalance = availableBalanceVnd >= amount;
  const error = momoMutation.error ? getApiErrorDetail(momoMutation.error, "Không tạo được thanh toán MoMo.") : null;

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
            <h3 className="font-bold text-typography-main uppercase tracking-wider text-xs">Thanh Toán MoMo & Ví Belooga</h3>
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

        {paidMethodLabel ? (
          <div data-testid="payment-success-receipt" className="py-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-typography-main">Thanh toán thành công</div>
            <div className="text-typography-muted text-[11px]">
              Phương thức: <strong className="text-typography-main">{paidMethodLabel}</strong>
            </div>
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
              <div className="text-2xl font-bold font-mono text-pink-700 mt-0.5">{formatVnd(amount)}</div>
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
                  <span>{isPayingWithWallet ? "Đang trừ ví..." : "Thanh Toán Bằng Số Dư Ví"}</span>
                </Button>
              ) : (
                <Link data-testid="link-topup-wallet" href="/workspace/wallet" className="block text-center text-amber-700 font-semibold hover:underline">
                  Số dư không đủ — Nạp thêm qua MoMo
                </Link>
              )}
            </div>

            <Button
              type="button"
              data-testid="btn-momo-pay"
              disabled={momoMutation.isPending || Boolean(momoOrderId)}
              onClick={() => momoMutation.mutate()}
              className="w-full bg-pink-700 hover:bg-pink-800 text-white font-semibold text-xs h-8 rounded-lg shadow-xs gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{momoOrderId ? "Đang chờ MoMo xác nhận..." : "Thanh Toán Qua MoMo"}</span>
            </Button>
            {momoMutation.data && (
              <a href={momoMutation.data.pay_url} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-brand-primary hover:underline">
                Mở lại trang thanh toán MoMo
              </a>
            )}
            {orderStatus?.status === "FAILED" && (
              <p className="text-[11px] text-red-700">Giao dịch MoMo không thành công.</p>
            )}
            {error && <p role="alert" className="text-[11px] text-red-700">{error}</p>}

            <Button
              onClick={onClose}
              className="w-full bg-surface-card hover:bg-surface-page text-typography-heading border border-surface-border text-xs h-8 rounded-lg shadow-xs"
            >
              Hủy Giao Dịch
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
