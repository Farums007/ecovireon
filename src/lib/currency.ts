export type Currency = "USD" | "EUR" | "GBP" | "NGN" | "ZAR" | "KES" | "GHS" | "INR" | "CAD" | "AUD";

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "USD ($)",
  EUR: "EUR (€)",
  GBP: "GBP (£)",
  NGN: "NGN (₦)",
  ZAR: "ZAR (R)",
  KES: "KES (KSh)",
  GHS: "GHS (₵)",
  INR: "INR (₹)",
  CAD: "CAD (C$)",
  AUD: "AUD (A$)",
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  NGN: "₦",
  ZAR: "R",
  KES: "KSh",
  GHS: "₵",
  INR: "₹",
  CAD: "C$",
  AUD: "A$",
};
