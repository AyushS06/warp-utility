"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCalculator } from "@/contexts/calculator-context"
import { CURRENCIES } from "@/lib/currency"
import type { Currency } from "@/lib/currency"

export function CurrencySelector() {
  const { state, setCurrency } = useCalculator()
  const currentCurrency = state.currency

  return (
    <Select
      value={currentCurrency}
      onValueChange={(value) => setCurrency(value as Currency)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((currency) => (
          <SelectItem key={currency.value} value={currency.value}>
            {currency.symbol} {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

