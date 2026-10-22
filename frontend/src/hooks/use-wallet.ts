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

const WALLET_STORAGE_KEY = "belooga_user_wallet_v1";

const DEFAULT_WALLET_STATE: UserWalletStateDTO = {
  available_balance_vnd: 1500000,
  escrow_locked_vnd: 490000,
  transactions: [
    {
      id: "wtx-init-1",
      tx_type: "TOPUP",
      amount_vnd: 2000000,
      description: "Nạp số dư Ví Belooga qua MoMo QR",
      reference_id: "MOMO-TOPUP-001",
      status: "COMPLETED",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "wtx-init-2",
      tx_type: "EXPERT_ESCROW_LOCK",
      amount_vnd: 490000,
      description: "Tạm giữ Escrow bảo vệ đơn chấm CV Expert Review",
      reference_id: "ORD-ESCROW-01",
      status: "LOCKED_IN_ESCROW",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "wtx-init-3",
      tx_type: "SYSTEM_PURCHASE",
      amount_vnd: 20000,
      description: "Mua gói 1-Click Tối Ưu CV Chuẩn STAR (ATS Micro-Pass)",
      reference_id: "ATS-PASS-01",
      status: "COMPLETED",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ],
};

function loadLocalWallet(): UserWalletStateDTO {
  if (typeof window === "undefined") return DEFAULT_WALLET_STATE;
  try {
    const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return DEFAULT_WALLET_STATE;
    const parsed = JSON.parse(raw) as UserWalletStateDTO;
    if (typeof parsed.available_balance_vnd === "number" && Array.isArray(parsed.transactions)) {
      return parsed;
    }
  } catch {
    return DEFAULT_WALLET_STATE;
  }
  return DEFAULT_WALLET_STATE;
}

function saveLocalWallet(state: UserWalletStateDTO): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage quota ignored
  }
}

export function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN")} đ`;
}

export function useWallet() {
  const queryClient = useQueryClient();

  const walletQuery = useQuery<UserWalletStateDTO>({
    queryKey: ["user-wallet"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<UserWalletStateDTO>("/v1/wallet/");
        if (typeof res.data?.available_balance_vnd === "number") {
          saveLocalWallet(res.data);
          return res.data;
        }
      } catch {
        // Fallback to local wallet ledger when backend endpoint is offline
      }
      return loadLocalWallet();
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

  const topupMutation = useMutation({
    mutationFn: async ( payload: { amount_vnd: number; payment_method?: string } ) => {
      try {
        const res = await apiClient.post<UserWalletStateDTO>("/v1/wallet/topup", payload);
        if (typeof res.data?.available_balance_vnd === "number") {
          saveLocalWallet(res.data);
          return res.data;
        }
      } catch {
        // Local topup fallback
      }
      const current = loadLocalWallet();
      const updated: UserWalletStateDTO = {
        ...current,
        available_balance_vnd: current.available_balance_vnd + payload.amount_vnd,
        transactions: [
          {
            id: `wtx-${Date.now()}`,
            tx_type: "TOPUP",
            amount_vnd: payload.amount_vnd,
            description: `Nạp tiền vào Ví Belooga (${payload.payment_method || "MoMo QR"})`,
            reference_id: `TOPUP-${Date.now()}`,
            status: "COMPLETED",
            created_at: new Date().toISOString(),
          },
          ...current.transactions,
        ],
      };
      saveLocalWallet(updated);
      return updated;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["user-wallet"], data);
      await invalidateRelated();
    },
  });

  const payMutation = useMutation({
    mutationFn: async (payload: {
      amount_vnd: number;
      target_type: "SYSTEM_PURCHASE" | "EXPERT_ESCROW_LOCK";
      order_id?: string;
      description: string;
    }) => {
      try {
        const res = await apiClient.post<UserWalletStateDTO>("/v1/wallet/pay", payload);
        if (typeof res.data?.available_balance_vnd === "number") {
          saveLocalWallet(res.data);
          return res.data;
        }
      } catch {
        // Local pay fallback
      }
      const current = loadLocalWallet();
      if (current.available_balance_vnd < payload.amount_vnd) {
        throw new Error("Số dư ví không đủ. Vui lòng nạp thêm tiền vào ví.");
      }
      const isEscrow = payload.target_type === "EXPERT_ESCROW_LOCK";
      const updated: UserWalletStateDTO = {
        available_balance_vnd: current.available_balance_vnd - payload.amount_vnd,
        escrow_locked_vnd: isEscrow
          ? current.escrow_locked_vnd + payload.amount_vnd
          : current.escrow_locked_vnd,
        transactions: [
          {
            id: `wtx-${Date.now()}`,
            tx_type: payload.target_type,
            amount_vnd: payload.amount_vnd,
            description: payload.description,
            reference_id: payload.order_id || `PAY-${Date.now()}`,
            status: isEscrow ? "LOCKED_IN_ESCROW" : "COMPLETED",
            created_at: new Date().toISOString(),
          },
          ...current.transactions,
        ],
      };
      saveLocalWallet(updated);
      return updated;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["user-wallet"], data);
      await invalidateRelated();
    },
  });

  const releaseEscrowMutation = useMutation({
    mutationFn: async (payload: { order_id: string; amount_vnd: number; expert_name?: string }) => {
      await Promise.allSettled([
        apiClient.post(`/v1/expert-review/orders/${payload.order_id}/simulate-delivery`, {}),
        apiClient.post(`/v1/expert-review/orders/${payload.order_id}/complete`, {}),
      ]);
      const current = loadLocalWallet();
      const unlockAmount = Math.min(current.escrow_locked_vnd, payload.amount_vnd || 490000);
      const updated: UserWalletStateDTO = {
        ...current,
        escrow_locked_vnd: Math.max(0, current.escrow_locked_vnd - unlockAmount),
        transactions: [
          {
            id: `wtx-${Date.now()}`,
            tx_type: "EXPERT_ESCROW_RELEASE",
            amount_vnd: payload.amount_vnd || 490000,
            description: `Nghiệm thu & Giải ngân Escrow cho Expert ${payload.expert_name || "Reviewer"} (Đơn #${payload.order_id.slice(0, 8)})`,
            reference_id: payload.order_id,
            status: "RELEASED",
            created_at: new Date().toISOString(),
          },
          ...current.transactions,
        ],
      };
      saveLocalWallet(updated);
      return updated;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["user-wallet"], data);
      await invalidateRelated();
    },
  });

  const wallet = walletQuery.data ?? DEFAULT_WALLET_STATE;

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
