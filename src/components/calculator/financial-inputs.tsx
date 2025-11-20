"use client"

import * as React from "react"
import type { UseFormReturn } from "react-hook-form"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import type { CalculatorFormValues } from "@/lib/schemas/calculator"

type FinancialInputsProps = {
  form: UseFormReturn<CalculatorFormValues>
}

const financialFields: {
  name: keyof CalculatorFormValues["financialInputs"]
  label: string
  description: string
  suffix?: string
}[] = [
  {
    name: "totalCashOnHand",
    label: "Total cash on hand",
    description: "Cash currently available to deploy.",
    suffix: "USD",
  },
  {
    name: "monthlyExistingBurn",
    label: "Monthly existing burn",
    description: "Burn before new hires (rent, infra, etc.).",
    suffix: "/mo",
  },
  {
    name: "expectedMonthlyRevenue",
    label: "Expected revenue",
    description: "Recurring revenue expected each month.",
    suffix: "/mo",
  },
  {
    name: "targetRunwayMonths",
    label: "Target runway (months)",
    description: "Goal runway after hiring.",
  },
  {
    name: "contingencyBufferPercent",
    label: "Contingency buffer %",
    description: "Buffer applied to account for uncertainty.",
    suffix: "%",
  },
]

export function FinancialInputsSection({ form }: FinancialInputsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {financialFields.map((fieldConfig) => (
        <FormField
          key={fieldConfig.name}
          control={form.control}
          name={`financialInputs.${fieldConfig.name}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{fieldConfig.label}</FormLabel>
              <FormControl>
                <div className="relative">
                  <FormattedNumberInput
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    min={0}
                    allowDecimals={fieldConfig.name === "contingencyBufferPercent"}
                    className="pr-12"
                  />
                  {fieldConfig.suffix && (
                    <span className="text-muted-foreground absolute inset-y-0 right-3 flex items-center text-sm">
                      {fieldConfig.suffix}
                    </span>
                  )}
                </div>
              </FormControl>
              <FormDescription>{fieldConfig.description}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  )
}

