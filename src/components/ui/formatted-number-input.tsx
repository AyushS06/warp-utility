"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type FormattedNumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value: number | undefined
  onChange: (value: number | undefined) => void
  allowDecimals?: boolean
  min?: number
  max?: number
}

export function FormattedNumberInput({
  value,
  onChange,
  allowDecimals = false,
  min,
  max,
  className,
  ...props
}: FormattedNumberInputProps) {
  const [displayValue, setDisplayValue] = React.useState("")
  const [isFocused, setIsFocused] = React.useState(false)

  // Format number with commas
  const formatNumber = React.useCallback(
    (num: number | undefined): string => {
      if (num === undefined || num === null || isNaN(num)) return ""
      if (allowDecimals) {
        return num.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })
      }
      return Math.round(num).toLocaleString("en-US")
    },
    [allowDecimals]
  )

  // Parse formatted string to number
  const parseNumber = React.useCallback(
    (str: string): number | undefined => {
      const cleaned = str.replace(/,/g, "")
      if (cleaned === "" || cleaned === "-") return undefined
      const parsed = allowDecimals ? parseFloat(cleaned) : parseInt(cleaned, 10)
      if (isNaN(parsed)) return undefined
      if (min !== undefined && parsed < min) return min
      if (max !== undefined && parsed > max) return max
      return parsed
    },
    [allowDecimals, min, max]
  )

  // Initialize display value from prop (only when not focused to avoid cursor jumps)
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatNumber(value))
    }
  }, [value, formatNumber, isFocused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Allow empty input
    if (inputValue === "") {
      setDisplayValue("")
      onChange(undefined)
      return
    }

    // Allow typing commas and numbers
    const validPattern = allowDecimals
      ? /^-?\d*,?\d*\.?\d*$/
      : /^-?\d*,?\d*$/

    if (!validPattern.test(inputValue)) {
      return
    }

    setDisplayValue(inputValue)
    const parsed = parseNumber(inputValue)
    if (parsed !== undefined) {
      onChange(parsed)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Reformat on blur to ensure proper formatting
    const parsed = parseNumber(displayValue)
    if (parsed !== undefined) {
      setDisplayValue(formatNumber(parsed))
      onChange(parsed)
    } else if (displayValue !== "") {
      // If invalid, reset to formatted value
      setDisplayValue(formatNumber(value))
    }
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  )
}

