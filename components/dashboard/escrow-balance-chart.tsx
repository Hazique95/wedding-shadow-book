"use client";

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";

import { formatMoney } from "@/lib/currency";
import type { DashboardFinanceSummary } from "@/lib/dashboard/queries";

type EscrowBalanceChartProps = {
  summary: DashboardFinanceSummary;
};

export function EscrowBalanceChart({ summary }: EscrowBalanceChartProps) {
  if (!summary.chartData.length) {
    return <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No booking balances yet.</div>;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={summary.chartData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={3}>
            {summary.chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatMoney(Number(value ?? 0), summary.currency)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}