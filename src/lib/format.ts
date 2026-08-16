export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

// Static approximate rates for display only — actual charges always process
// in Naira via Paystack (see lib/paystack.ts), so this never feeds a real
// charge amount. It exists purely so donors outside Nigeria see a rough
// figure in a currency they recognize. Update the rates occasionally; they
// don't need to track a live feed for a "roughly $X" hint.
const APPROX_NGN_RATES: { code: string; symbol: string; ngnPerUnit: number }[] = [
  { code: "USD", symbol: "$", ngnPerUnit: 1600 },
  { code: "EUR", symbol: "€", ngnPerUnit: 1750 },
  { code: "GBP", symbol: "£", ngnPerUnit: 2000 },
];

export function formatApproxForeignEquivalents(kobo: number): string {
  const naira = kobo / 100;
  return APPROX_NGN_RATES.map(
    ({ symbol, ngnPerUnit }) => `≈ ${symbol}${(naira / ngnPerUnit).toFixed(2)}`
  ).join("   ·   ");
}
