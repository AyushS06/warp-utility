"use client"

import * as React from "react"
import { format, addMonths, startOfMonth, differenceInMonths, parseISO } from "date-fns"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCalculator } from "@/contexts/calculator-context"
import type { RoleInput } from "@/lib/types"
import { ROLE_TEMPLATES, getRoleIcon } from "@/lib/role-templates"
import { getSalaryForRoleAndLocation } from "@/lib/role-templates"
import { Progress } from "@/components/ui/progress"

type RoleWithOptionalId = Omit<RoleInput, "id" | "equityPercentage"> & {
  id?: string
  equityPercentage?: number | ""
}

type TimelineViewProps = {
  roles: RoleWithOptionalId[]
  onRolesChange: (roles: RoleInput[]) => void
  locations: Array<{ id: string; label: string }>
}

type ViewMode = "monthly" | "yearly"

function RoleCard({
  role,
  locations,
  onUpdate,
  onRemove,
}: {
  role: RoleWithOptionalId
  locations: Array<{ id: string; label: string }>
  onUpdate: (updates: Partial<RoleInput>) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: role.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const location = locations.find((loc) => loc.id === role.locationId)
  const icon = role.category ? getRoleIcon(role.category) : "👤"

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-2 cursor-move border-l-4"
      data-role-id={role.id}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <div className="flex-1">
                <div className="font-semibold">{role.title}</div>
                <div className="text-sm text-muted-foreground">
                  {location?.label ?? "Unknown location"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onRemove}
              >
                ×
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Salary:</span>{" "}
                ${role.baseSalary.toLocaleString()}
              </div>
              <div>
                <span className="text-muted-foreground">Headcount:</span> {role.headcount}
              </div>
              <div>
                <span className="text-muted-foreground">Hire date:</span>{" "}
                {format(parseISO(role.hiringDate), "MMM yyyy")}
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span> {role.employmentType}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TimelineView({ roles, onRolesChange, locations }: TimelineViewProps) {
  const { state } = useCalculator()
  const [viewMode, setViewMode] = React.useState<ViewMode>("monthly")
  const [startDate, setStartDate] = React.useState(() => startOfMonth(new Date()))
  
  const metrics = state.metrics
  const runwayMonths = metrics?.remainingRunwayMonths ?? 0
  const targetRunway = state.financialInputs.targetRunwayMonths
  const runwayPercentage = runwayMonths === Infinity 
    ? 100 
    : Math.min(100, Math.max(0, (runwayMonths / targetRunway) * 100))

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = roles.findIndex((r) => r.id === active.id)
      const newIndex = roles.findIndex((r) => r.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        onRolesChange(arrayMove(roles, oldIndex, newIndex))
      }
    }
  }

  const handleAddRole = () => {
    // This will be handled by the parent component via role picker
    // Keeping for backwards compatibility but should trigger role picker
  }

  // Group roles by month/year
  const groupedRoles = React.useMemo(() => {
    const groups: Record<string, RoleInput[]> = {}
    roles.forEach((role) => {
      const date = parseISO(role.hiringDate)
      const key =
        viewMode === "monthly"
          ? format(date, "yyyy-MM")
          : format(date, "yyyy")
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(role)
    })
    return groups
  }, [roles, viewMode])

  // Generate timeline months/years
  const timelinePeriods = React.useMemo(() => {
    const periods: string[] = []
    const endDate = addMonths(startDate, viewMode === "monthly" ? 24 : 3)
    let current = startDate

    while (current <= endDate) {
      periods.push(
        viewMode === "monthly"
          ? format(current, "yyyy-MM")
          : format(current, "yyyy")
      )
      current = addMonths(current, viewMode === "monthly" ? 1 : 12)
    }
    return periods
  }, [startDate, viewMode])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Runway Impact Visualization */}
      {metrics && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Cash runway impact</span>
                <span className="text-muted-foreground">
                  {runwayMonths === Infinity
                    ? "∞ months"
                    : `${runwayMonths.toFixed(1)} months remaining`}
                </span>
              </div>
              <Progress value={runwayPercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Target: {targetRunway} months</span>
                <span>
                  {runwayMonths === Infinity
                    ? "No burn"
                    : runwayMonths >= targetRunway
                      ? "✓ On track"
                      : "⚠ Below target"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {timelinePeriods.map((period) => {
            const periodRoles = groupedRoles[period] || []
            const periodDate =
              viewMode === "monthly"
                ? parseISO(`${period}-01`)
                : parseISO(`${period}-01-01`)

            return (
              <div key={period} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-lg">
                    {format(periodDate, viewMode === "monthly" ? "MMMM yyyy" : "yyyy")}
                  </div>
                  <div className="flex-1 border-t" />
                  <div className="text-sm text-muted-foreground">
                    {periodRoles.length} {periodRoles.length === 1 ? "role" : "roles"}
                  </div>
                </div>
                {periodRoles.length > 0 ? (
                  <SortableContext
                    items={periodRoles.map(
                      (r, idx) => r.id || `${period}-${idx}-${r.title}`
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 pl-4 border-l-2">
                      {periodRoles.map((role, idx) => {
                        const key = role.id || `${period}-${idx}-${role.title}`
                        return (
                        <RoleCard
                          key={key}
                          role={role}
                          locations={locations}
                          onUpdate={(updates) => {
                            onRolesChange(
                              roles.map((r) =>
                                r.id === role.id ? { ...r, ...updates } : r
                              )
                            )
                          }}
                          onRemove={() => {
                            onRolesChange(roles.filter((r) => r.id !== role.id))
                          }}
                        />
                        )
                      })}
                    </div>
                  </SortableContext>
                ) : (
                  <div className="pl-4 border-l-2 text-sm text-muted-foreground py-2">
                    No roles scheduled
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}

