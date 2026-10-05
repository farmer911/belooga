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
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-700 text-[10px]">Đã Thu</Badge>;
      case "HELD_IN_ESCROW":
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-700 text-[10px]">Tạm Giữ Escrow</Badge>;
      case "RELEASED":
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-700 text-[10px]">Đã Giải Ngân</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 rounded bg-slate-900/80 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <span>🧾</span> Nhật Ký Giao Dịch MoMo & Escrow Thời Gian Thực
        </h4>
        <span className="text-[10px] text-slate-400">Tự động đối soát chữ ký HMAC</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
              <th className="pb-2 font-medium">Mã GD</th>
              <th className="pb-2 font-medium">Khách Hàng</th>
              <th className="pb-2 font-medium">Gói Dịch Vụ</th>
              <th className="pb-2 font-medium text-right">Tổng Tiền</th>
              <th className="pb-2 font-medium text-right">Phí Sàn</th>
              <th className="pb-2 font-medium text-center">Cổng</th>
              <th className="pb-2 font-medium text-center">Trạng Thái</th>
              <th className="pb-2 font-medium text-right">Thời Gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/30 transition">
                <td className="py-2 text-cyan-400 font-semibold">{t.id}</td>
                <td className="py-2 text-slate-200 font-sans font-medium">{t.user_name}</td>
                <td className="py-2 text-slate-300 font-sans">{t.package_name}</td>
                <td className="py-2 text-right font-semibold text-slate-100">{formatVND(t.amount)}</td>
                <td className="py-2 text-right text-emerald-400 font-semibold">{formatVND(t.platform_fee)}</td>
                <td className="py-2 text-center text-pink-400 font-sans font-medium">{t.payment_method}</td>
                <td className="py-2 text-center">{getStatusBadge(t.status)}</td>
                <td className="py-2 text-right text-slate-500">{t.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
