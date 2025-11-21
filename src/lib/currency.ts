export type Currency = "USD" | "GBP" | "INR" | "EUR" | "JPY" | "CAD" | "AUD"

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "GBP", label: "British Pound", symbol: "£" },
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "INR", label: "Indian Rupee", symbol: "₹" },
  { value: "JPY", label: "Japanese Yen", symbol: "¥" },
  { value: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { value: "AUD", label: "Australian Dollar", symbol: "A$" },
]

export function formatCurrency(value: number, currency: Currency = "USD"): string {
  if (!Number.isFinite(value)) {
    return "—"
  }

  // Special handling for JPY (no decimal places)
  const maximumFractionDigits = currency === "JPY" ? 0 : 2
  const minimumFractionDigits = currency === "JPY" ? 0 : 2

  return new Intl.NumberFormat(getLocaleForCurrency(currency), {
    style: "currency",
    currency,
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value)
}

function getLocaleForCurrency(currency: Currency): string {
  const localeMap: Record<Currency, string> = {
    USD: "en-US",
    GBP: "en-GB",
    EUR: "en-EU",
    INR: "en-IN",
    JPY: "ja-JP",
    CAD: "en-CA",
    AUD: "en-AU",
  }
  return localeMap[currency] || "en-US"
}

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCIES.find((c) => c.value === currency)?.symbol || "$"
}

