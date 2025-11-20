"use client"

import * as React from "react"
import type { UseFormReturn } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import type { CalculatorFormValues } from "@/lib/schemas/calculator"

const runwayOptions = [12, 18, 24, 36]
const growthModes = [
  { label: "Cash-efficient", value: "cash-efficient" },
  { label: "Growth mode", value: "growth" },
  { label: "AI assist", value: "ai" },
]

type ScenarioControlsProps = {
  form: UseFormReturn<CalculatorFormValues>
}

export function ScenarioControlsSection({ form }: ScenarioControlsProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="financialInputs.targetRunwayMonths"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Runway target</FormLabel>
            <div className="flex flex-wrap gap-2">
              {runwayOptions.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={field.value === option ? "default" : "outline"}
                  onClick={() => field.onChange(option)}
                >
                  {option} months
                </Button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="scenario.revenueGrowthPercent"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Revenue growth scenario ({field.value}%)
            </FormLabel>
            <FormControl>
              <Slider
                min={-50}
                max={200}
                step={5}
                value={[field.value ?? 0]}
                onValueChange={(value) => field.onChange(value[0])}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="scenario.hiringStrategy"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hiring strategy</FormLabel>
            <div className="flex gap-2">
              {["staggered", "all-at-once"].map((strategy) => (
                <Button
                  key={strategy}
                  type="button"
                  variant={field.value === strategy ? "default" : "outline"}
                  onClick={() => field.onChange(strategy)}
                >
                  {strategy === "staggered" ? "Staggered" : "All at once"}
                </Button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="scenario.growthMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Planning mode</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {growthModes.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

