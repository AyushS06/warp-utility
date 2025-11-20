"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCalculator } from "@/contexts/calculator-context"
import {
  calculatorFormSchema,
  type CalculatorFormValues,
} from "@/lib/schemas/calculator"
import { FinancialInputsSection } from "@/components/calculator/financial-inputs"
import { LocationMultipliersSection } from "@/components/calculator/location-multipliers"
import { ScenarioControlsSection } from "@/components/calculator/scenario-controls"

type CalculatorFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CalculatorFormDialog({
  open,
  onOpenChange,
}: CalculatorFormDialogProps) {
  const { state, setFinancialInputs, setScenario, setLocations, setRoles } =
    useCalculator()

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: {
      financialInputs: state.financialInputs,
      roles: state.roles,
      locations: state.locations,
      scenario: state.scenario,
    },
    mode: "onBlur",
  })

  React.useEffect(() => {
    form.reset({
      financialInputs: state.financialInputs,
      roles: state.roles,
      locations: state.locations,
      scenario: state.scenario,
    })
  }, [state, form, open])

  const saveValues = React.useCallback(
    (values: CalculatorFormValues, options?: { close?: boolean }) => {
      setFinancialInputs(values.financialInputs)
      setScenario(values.scenario)
      setLocations(values.locations)
      setRoles(
        values.roles.map((role) => ({
          ...role,
          id: role.id ?? crypto.randomUUID(),
        }))
      )

      if (options?.close) {
        onOpenChange(false)
      }
    },
    [setFinancialInputs, setScenario, setLocations, setRoles, onOpenChange]
  )

  const quickSave = React.useMemo(
    () => form.handleSubmit((values) => saveValues(values)),
    [form, saveValues]
  )

  const onSubmit = React.useMemo(
    () => form.handleSubmit((values) => saveValues(values, { close: true })),
    [form, saveValues]
  )

  const [activeTab, setActiveTab] = React.useState("financials")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[1400px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Headcount planner</DialogTitle>
          <DialogDescription>
            Configure financial inputs, hiring plan, and scenario settings. All
            changes save to your browser automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex h-full flex-col gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full flex flex-wrap gap-2 justify-start">
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
                <TabsTrigger value="scenario">Scenario</TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-y-auto pr-2 w-full">
                <TabsContent value="financials" className="space-y-4 pt-4 w-full">
                  <FinancialInputsSection form={form} />
                  <div className="flex justify-end">
                    <Button type="button" variant="secondary" onClick={quickSave}>
                      Save financials
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="locations" className="space-y-4 pt-4 w-full">
                  <LocationMultipliersSection form={form} />
                  <div className="flex justify-end">
                    <Button type="button" variant="secondary" onClick={quickSave}>
                      Save locations
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="scenario" className="space-y-4 pt-4 w-full">
                  <ScenarioControlsSection form={form} />
                  <div className="flex justify-end">
                    <Button type="button" variant="secondary" onClick={quickSave}>
                      Save scenario
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save plan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

