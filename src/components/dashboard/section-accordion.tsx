"use client"

import * as React from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SectionConfig = {
  id: string
  title: string
  description?: string
  content: React.ReactNode
  defaultOpen?: boolean
}

type SectionAccordionProps = {
  sections: SectionConfig[]
  className?: string
}

export function SectionAccordion({ sections, className }: SectionAccordionProps) {
  const defaultValue = React.useMemo(
    () =>
      sections
        .filter((section) => section.defaultOpen !== false)
        .map((section) => section.id),
    [sections]
  )

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultValue}
      className={cn("space-y-4", className)}
    >
      {sections.map((section) => (
        <AccordionItem
          key={section.id}
          value={section.id}
          data-accordion-item={section.id}
          className="rounded-2xl border bg-card text-card-foreground px-0"
        >
          <AccordionTrigger className="px-6" data-accordion-trigger>
            <div className="text-left">
              <p className="text-base font-semibold">{section.title}</p>
              {section.description && (
                <p className="text-muted-foreground text-sm font-normal">
                  {section.description}
                </p>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6" data-section={section.id}>
            <Card className="border-none shadow-none bg-transparent p-0">
              <div className="space-y-6 py-2">{section.content}</div>
            </Card>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

