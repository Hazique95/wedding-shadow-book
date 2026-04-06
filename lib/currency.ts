import type { CurrencyCode } from "@/lib/auth-types";

export const SUPPORTED_PLATFORM_CURRENCIES: CurrencyCode[] = ["USD", "PKR"];

const DEFAULT_USD_TO_PKR_RATE = 280;

function getConfiguredUsdToPkrRate() {
  const configured = Number(process.env.NEXT_PUBLIC_USD_TO_PKR_RATE ?? process.env.USD_TO_PKR_RATE ?? DEFAULT_USD_TO_PKR_RATE);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_USD_TO_PKR_RATE;
}

export function roundCurrencyAmount(value: number, precision = 2) {
  return Number(value.toFixed(precision));
}

export function normalizeCurrency(value: unknown, fallback: CurrencyCode = "USD"): CurrencyCode {
  return value === "PKR" || value === "USD" ? value : fallback;
}

export function convertCurrencyAmount(amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode) {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  if (fromCurrency === toCurrency) {
    return roundCurrencyAmount(amount);
  }

  const usdToPkrRate = getConfiguredUsdToPkrRate();

  if (fromCurrency === "USD" && toCurrency === "PKR") {
    return roundCurrencyAmount(amount * usdToPkrRate);
  }

  if (fromCurrency === "PKR" && toCurrency === "USD") {
    return roundCurrencyAmount(amount / usdToPkrRate);
  }

  return roundCurrencyAmount(amount);
}

export function formatMoney(amount: number, currency: CurrencyCode = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "PKR" ? 0 : 2,
  }).format(amount);
}

export function toStripeCurrency(currency: CurrencyCode) {
  return currency.toLowerCase() as Lowercase<CurrencyCode>;
}

export function toMinorUnit(amount: number, currency: CurrencyCode) {
  if (currency === "USD" || currency === "PKR") {
    return Math.round(amount * 100);
  }

  return Math.round(amount * 100);
}

export function fromMinorUnit(amount: number, currency: CurrencyCode) {
  if (currency === "USD" || currency === "PKR") {
    return roundCurrencyAmount(amount / 100);
  }

  return roundCurrencyAmount(amount / 100);
}

export function calculateApplicationFee(amount: number) {
  return roundCurrencyAmount(amount * 0.1);
}

export function calculateVendorPayout(amount: number) {
  return roundCurrencyAmount(amount * 0.9);
}