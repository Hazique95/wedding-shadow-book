import type { CurrencyCode } from "@/lib/auth-types";
import { convertCurrencyAmount, roundCurrencyAmount } from "@/lib/currency";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/lib/events/types";
import type { VendorProfileRecord } from "@/lib/vendor/types";

export type EscrowChartDatum = {
  name: string;
  value: number;
  color: string;
};

export type DashboardFinanceSummary = {
  currency: CurrencyCode;
  totalEscrow: number;
  totalPlatformFees: number;
  totalVendorPayouts: number;
  chartData: EscrowChartDatum[];
};

function mapStatusLabel(status: BookingStatus) {
  switch (status) {
    case "paid":
      return "Paid";
    case "confirmed":
      return "Confirmed";
    case "payment_failed":
      return "Retry needed";
    default:
      return "Pending";
  }
}

function mapStatusColor(status: BookingStatus) {
  switch (status) {
    case "paid":
      return "#16a34a";
    case "confirmed":
      return "#2563eb";
    case "payment_failed":
      return "#dc2626";
    default:
      return "#f59e0b";
  }
}

export async function getDashboardFinanceSummary(options: {
  userId: string;
  role: "planner" | "vendor";
  currency: CurrencyCode;
}) {
  const supabase = await createClient();

  if (options.role === "planner") {
    const { data } = await supabase
      .from("bookings")
      .select("status, escrow_amount, application_fee_amount, vendor_payout_amount, currency")
      .eq("planner_user_id", options.userId);

    const rows = (data ?? []) as Array<{
      status: BookingStatus;
      escrow_amount: number;
      application_fee_amount: number | null;
      vendor_payout_amount: number | null;
      currency: CurrencyCode | null;
    }>;

    const chartBuckets = new Map<string, EscrowChartDatum>();
    let totalEscrow = 0;
    let totalPlatformFees = 0;
    let totalVendorPayouts = 0;

    for (const row of rows) {
      const sourceCurrency = row.currency ?? options.currency;
      const convertedEscrow = convertCurrencyAmount(Number(row.escrow_amount ?? 0), sourceCurrency, options.currency);
      const convertedFee = convertCurrencyAmount(Number(row.application_fee_amount ?? 0), sourceCurrency, options.currency);
      const convertedPayout = convertCurrencyAmount(Number(row.vendor_payout_amount ?? 0), sourceCurrency, options.currency);
      const label = mapStatusLabel(row.status);

      totalEscrow += convertedEscrow;
      totalPlatformFees += convertedFee;
      totalVendorPayouts += convertedPayout;

      const existing = chartBuckets.get(label);
      chartBuckets.set(label, {
        name: label,
        value: roundCurrencyAmount((existing?.value ?? 0) + convertedEscrow),
        color: mapStatusColor(row.status),
      });
    }

    return {
      currency: options.currency,
      totalEscrow: roundCurrencyAmount(totalEscrow),
      totalPlatformFees: roundCurrencyAmount(totalPlatformFees),
      totalVendorPayouts: roundCurrencyAmount(totalVendorPayouts),
      chartData: Array.from(chartBuckets.values()),
    } satisfies DashboardFinanceSummary;
  }

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", options.userId).maybeSingle();

  if (!(vendor as VendorProfileRecord | null)?.id) {
    return {
      currency: options.currency,
      totalEscrow: 0,
      totalPlatformFees: 0,
      totalVendorPayouts: 0,
      chartData: [],
    } satisfies DashboardFinanceSummary;
  }

  const { data } = await supabase
    .from("bookings")
    .select("status, vendor_payout_amount, application_fee_amount, currency")
    .eq("vendor_id", (vendor as { id: string }).id);

  const rows = (data ?? []) as Array<{
    status: BookingStatus;
    vendor_payout_amount: number | null;
    application_fee_amount: number | null;
    currency: CurrencyCode | null;
  }>;

  const chartBuckets = new Map<string, EscrowChartDatum>();
  let totalPayouts = 0;
  let totalFees = 0;

  for (const row of rows) {
    const sourceCurrency = row.currency ?? options.currency;
    const convertedPayout = convertCurrencyAmount(Number(row.vendor_payout_amount ?? 0), sourceCurrency, options.currency);
    const convertedFee = convertCurrencyAmount(Number(row.application_fee_amount ?? 0), sourceCurrency, options.currency);
    const label = mapStatusLabel(row.status);
    totalPayouts += convertedPayout;
    totalFees += convertedFee;

    const existing = chartBuckets.get(label);
    chartBuckets.set(label, {
      name: label,
      value: roundCurrencyAmount((existing?.value ?? 0) + convertedPayout),
      color: mapStatusColor(row.status),
    });
  }

  return {
    currency: options.currency,
    totalEscrow: roundCurrencyAmount(totalPayouts),
    totalPlatformFees: roundCurrencyAmount(totalFees),
    totalVendorPayouts: roundCurrencyAmount(totalPayouts),
    chartData: Array.from(chartBuckets.values()),
  } satisfies DashboardFinanceSummary;
}