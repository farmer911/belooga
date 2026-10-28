"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";

export type WalletTxType =
  | "TOPUP"
  | "SYSTEM_PURCHASE"
  | "EXPERT_ESCROW_LOCK"
  | "EXPERT_ESCROW_RELEASE"
  | "REFUND";

export interface WalletTransactionDTO {
  id: string;
  tx_type: WalletTxType;
  amount_vnd: number;
  description: string;
  reference_id?: string | null;
  status: string;
  created_at: string;
}

export interface UserWalletStateDTO {
  available_balance_vnd: number;
  escrow_locked_vnd: number;
  transactions: WalletTransactionDTO[];
}

export interface MomoPaymentDTO {
  order_id: string;
  pay_url: string;
  qr_code_url?: string | null;
  deeplink?: string | null;
  amount: number;
  message: string;
}

export function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN")} đ`;
}

export function useWallet() {
  const queryClient = useQueryClient();

  const walletQuery = useQuery<UserWalletStateDTO>({
    queryKey: ["user-wallet"],
    queryFn: async () => {
      const res = await apiClient.get<UserWalletStateDTO>("/v1/wallet/");
      return res.data;
    },
    staleTime: 10_000,
  });

  const invalidateRelated = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["user-wallet"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["expert-review-my-orders"] }),
    ]);
  };

  // Top-up creates a MoMo order and sends the user to MoMo; the balance changes only after MoMo's IPN.
  const topupMutation = useMutation({
    mutationFn: async (payload: { amount_vnd: number }) => {
      const res = await apiClient.post<MomoPaymentDTO>("/v1/wallet/topup", payload);
      return res.data;
    },
    onSuccess: (data) => {
      window.location.assign(data.pay_url);
    },
  });

  const payMutation = useMutation({
    mutationFn: async (payload: {
      amount_vnd: number;
      target_type: "SYSTEM_PURCHASE" | "EXPERT_ESCROW_LOCK";
      order_id?: string;
      description: string;
    }) => {
      const res = await apiClient.post<UserWalletStateDTO>("/v1/wallet/pay", payload);
      return res.data;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["user-wallet"], data);
      await invalidateRelated();
    },
  });

  const releaseEscrowMutation = useMutation({
    mutationFn: async (payload: { order_id: string; amount_vnd: number; expert_name?: string }) => {
      await apiClient.post(`/v1/expert-review/orders/${payload.order_id}/complete`, {});
      const res = await apiClient.get<UserWalletStateDTO>("/v1/wallet/");
      return res.data;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["user-wallet"], data);
      await invalidateRelated();
    },
  });

  const wallet: UserWalletStateDTO = walletQuery.data ?? {
    available_balance_vnd: 0,
    escrow_locked_vnd: 0,
    transactions: [],
  };

  return {
    wallet,
    availableBalanceVnd: wallet.available_balance_vnd,
    escrowLockedVnd: wallet.escrow_locked_vnd,
    transactions: wallet.transactions,
    isLoading: walletQuery.isLoading,
    topupWallet: topupMutation.mutateAsync,
    isToppingUp: topupMutation.isPending,
    payWithWallet: payMutation.mutateAsync,
    isPayingWithWallet: payMutation.isPending,
    releaseEscrow: releaseEscrowMutation.mutateAsync,
    isReleasingEscrow: releaseEscrowMutation.isPending,
  };
}
