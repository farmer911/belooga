"use client";

import React from "react";
import { TransactionRecord } from "@/hooks/use-analytics-dashboard";
import { Badge } from "@/components/ui/badge";

interface AnalyticsTransactionsTableProps {
  transactions: TransactionRecord[];
}

export function AnalyticsTransactionsTable({ transactions }: AnalyticsTransactionsTableProps) {
  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

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
    <div className="p-5 rounded-xl bg-white border border-surface-border space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-surface-divider pb-3">
        <h4 className="font-bold text-typography-main text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <span>🧾</span> Nhật Ký Giao Dịch MoMo & Escrow Thời Gian Thực
        </h4>
        <span className="text-[10px] text-typography-muted">Tự động đối soát chữ ký HMAC</span>
      </div>

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
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-surface-page transition-colors">
                <td className="py-2.5 text-brand-primary font-semibold">{t.id}</td>
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
