"use client";

import React, { useState, useMemo } from "react";
import { Receipt, Search, ShieldCheck, X } from "lucide-react";
import { TransactionRecord } from "@/hooks/use-analytics-dashboard";
import { Badge } from "@/components/ui/badge";

interface AnalyticsTransactionsTableProps {
  transactions: TransactionRecord[];
}

export function AnalyticsTransactionsTable({ transactions }: AnalyticsTransactionsTableProps) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUCCESS" | "HELD_IN_ESCROW" | "RELEASED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.id.toLowerCase().includes(q) ||
          t.user_name.toLowerCase().includes(q) ||
          t.package_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, statusFilter, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-semibold">Đã Thu</Badge>;
      case "HELD_IN_ESCROW":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] font-semibold">Tạm Giữ Escrow</Badge>;
      case "RELEASED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-300 text-[10px] font-semibold">Đã Giải Ngân</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] text-typography-heading border-surface-border">{status}</Badge>;
    }
  };

  return (
    <div className="p-5 rounded-xl bg-surface-card border border-surface-border space-y-3.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-divider pb-3">
        <h4 className="font-bold text-typography-main text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <Receipt className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
          <span>Nhật Ký Giao Dịch MoMo & Escrow Thời Gian Thực ({filteredTransactions.length})</span>
        </h4>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 text-typography-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              data-testid="analytics-tx-filter-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc mã GD, khách hàng..."
              className="pl-7 pr-2.5 py-1 rounded-md border border-surface-border bg-surface-page text-[11px] text-typography-main focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div className="flex items-center bg-surface-page border border-surface-border rounded-md p-0.5 text-[10px]">
            {(["ALL", "SUCCESS", "HELD_IN_ESCROW", "RELEASED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                data-testid={`analytics-tx-status-${st}`}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  statusFilter === st ? "bg-brand-primary text-white font-semibold" : "text-typography-muted hover:text-typography-main"
                }`}
              >
                {st === "ALL" ? "Mọi GD" : st === "SUCCESS" ? "Đã thu" : st === "HELD_IN_ESCROW" ? "Escrow" : "Giải ngân"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedTx && (
        <div
          data-testid="analytics-tx-detail-panel"
          className="p-3.5 rounded-lg border border-teal-200 bg-teal-50/40 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              <span className="font-bold text-typography-main">Chi Tiết Đối Soát Giao Dịch #{selectedTx.id}</span>
              {getStatusBadge(selectedTx.status)}
            </div>
            <p className="text-[11px] text-typography-heading">
              Khách hàng: <strong>{selectedTx.user_name}</strong> · Gói: <strong>{selectedTx.package_name}</strong> · Cổng: <strong>{selectedTx.payment_method}</strong> · Thực nhận sau phí sàn:{" "}
              <strong className="text-emerald-700">{formatVND(Math.max(0, selectedTx.amount - selectedTx.platform_fee))}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedTx(null)}
            className="p-1 rounded hover:bg-surface-card text-typography-muted hover:text-typography-main cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-surface-divider text-typography-muted text-[11px]">
              <th className="pb-2.5 font-medium">Mã GD</th>
              <th className="pb-2.5 font-medium">Khách Hàng</th>
              <th className="pb-2.5 font-medium">Gói Dịch Vụ</th>
              <th className="pb-2.5 font-medium text-right">Tổng Tiền</th>
              <th className="pb-2.5 font-medium text-right">Phí Sàn</th>
              <th className="pb-2.5 font-medium text-center">Cổng</th>
              <th className="pb-2.5 font-medium text-center">Trạng Thái</th>
              <th className="pb-2.5 font-medium text-right">Thời Gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-divider font-mono text-[11px]">
            {filteredTransactions.map((t) => (
              <tr
                key={t.id}
                data-testid={`analytics-tx-row-${t.id}`}
                onClick={() => setSelectedTx(t)}
                className="hover:bg-surface-page transition-colors cursor-pointer"
              >
                <td className="py-2.5 text-brand-primary font-semibold underline-offset-2 hover:underline">{t.id}</td>
                <td className="py-2.5 text-typography-main font-sans font-medium">{t.user_name}</td>
                <td className="py-2.5 text-typography-heading font-sans">{t.package_name}</td>
                <td className="py-2.5 text-right font-semibold text-typography-main">{formatVND(t.amount)}</td>
                <td className="py-2.5 text-right text-emerald-700 font-semibold">{formatVND(t.platform_fee)}</td>
                <td className="py-2.5 text-center text-pink-700 font-sans font-bold">{t.payment_method}</td>
                <td className="py-2.5 text-center">{getStatusBadge(t.status)}</td>
                <td className="py-2.5 text-right text-typography-muted">{t.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
