"use client"

import * as React from "react"
import { PlusIcon, XIcon } from "lucide-react"
import { useFieldArray, type UseFormReturn } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { CalculatorFormValues } from "@/lib/schemas/calculator"

type LocationMultipliersProps = {
  form: UseFormReturn<CalculatorFormValues>
}

export function LocationMultipliersSection({
  form,
}: LocationMultipliersProps) {
  const { control } = form
  const { fields, append, remove } = useFieldArray({
    control,
    name: "locations",
  })

  const handleAddLocation = React.useCallback(() => {
    append({
      id: crypto.randomUUID(),
      label: "Custom location",
      salaryMultiplier: 1,
      benefitsMultiplier: 0.3,
      canEdit: true,
    })
  }, [append])

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border border-dashed rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <FormField
                control={control}
                name={`locations.${index}.label`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Location name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!form.getValues(`locations.${index}.canEdit`)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.getValues(`locations.${index}.canEdit`) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={() => remove(index)}
                  aria-label="Remove location"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name={`locations.${index}.salaryMultiplier`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary multiplier</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0.1}
                        step="0.05"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`locations.${index}.benefitsMultiplier`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits / tax multiplier</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.05"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={handleAddLocation}>
        <PlusIcon className="mr-2 h-4 w-4" />
        Add custom multiplier
      </Button>
    </div>
  )
}

