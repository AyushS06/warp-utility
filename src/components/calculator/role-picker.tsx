"use client"

import * as React from "react"
import {
  ROLE_TEMPLATES,
  getSalaryForRoleAndLocation,
  type RoleCategory,
} from "@/lib/role-templates"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { RoleInput } from "@/lib/types"

type RolePickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (role: Omit<RoleInput, "id">) => void
  defaultLocationId: string
}

const CATEGORY_LABELS: Record<RoleCategory, string> = {
  engineering: "Engineering",
  sales: "Sales",
  design: "Design",
  product: "Product",
  marketing: "Marketing",
  operations: "Operations",
  finance: "Finance",
  hr: "HR",
  other: "Other",
}

export function RolePicker({
  open,
  onOpenChange,
  onSelect,
  defaultLocationId,
}: RolePickerProps) {
  const [selectedCategory, setSelectedCategory] =
    React.useState<RoleCategory | "all">("all")

  const categories = React.useMemo(() => {
    const cats = new Set<RoleCategory>()
    ROLE_TEMPLATES.forEach((template) => {
      cats.add(template.category)
    })
    return Array.from(cats)
  }, [])

  const filteredTemplates = React.useMemo(() => {
    if (selectedCategory === "all") {
      return ROLE_TEMPLATES
    }
    return ROLE_TEMPLATES.filter((t) => t.category === selectedCategory)
  }, [selectedCategory])

  const handleSelectTemplate = (template: typeof ROLE_TEMPLATES[0]) => {
    const salary = getSalaryForRoleAndLocation(template, defaultLocationId)
    onSelect({
      title: template.title,
      category: template.category,
      locationId: defaultLocationId,
      baseSalary: salary,
      benefitsMultiplier: 0.3,
      hiringDate: new Date().toISOString().split("T")[0],
      headcount: 1,
      employmentType: "full-time",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select role template</DialogTitle>
          <DialogDescription>
            Choose a role template to add to your hiring plan. Templates include
            pre-populated salary ranges.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {CATEGORY_LABELS[category]}
              </Button>
            ))}
          </div>

          <ScrollArea className="h-[400px]">
            <div className="grid gap-2 pr-4">
              {filteredTemplates.map((template) => (
                <Button
                  key={template.title}
                  variant="outline"
                  className="h-auto justify-start p-4"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <span className="text-2xl">{template.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{template.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {CATEGORY_LABELS[template.category]}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

