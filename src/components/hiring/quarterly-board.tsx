"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

import { useCalculator } from "@/contexts/calculator-context"
import type { RoleInput } from "@/lib/types"
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency"
import {
  ensureQuarterInRange,
  getColumnsForYears,
  getQuarterIdFromDate,
  getQuarterLabel,
  type QuarterColumn,
} from "@/lib/quarters"
import { getCategoryLabel } from "@/lib/role-categories"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const YEARS_TO_RENDER = 3

type HireCardDragData = {
  type: "hire-card"
  roleId: string
  quarterId: string
}

type QuarterColumnDragData = {
  type: "quarter-column"
  columnId: string
}

export function QuarterlyHiringBoard() {
  const { state, updateRole } = useCalculator()
  
  const formatCurrency = React.useCallback(
    (value: number) => {
      if (!value) return formatCurrencyUtil(0, state.currency)
      return formatCurrencyUtil(value, state.currency)
    },
    [state.currency]
  )
  
  const columns = React.useMemo(() => getColumnsForYears(YEARS_TO_RENDER), [])
  const columnIds = React.useMemo(() => columns.map((column) => column.id), [columns])
  const [activeRoleId, setActiveRoleId] = React.useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const costLookup = React.useMemo(() => {
    return Object.fromEntries(
      state.metrics?.fullyLoadedCostPerRole.map((cost) => [
        cost.roleId,
        cost.monthlyFullyLoadedCost,
      ]) ?? []
    )
  }, [state.metrics?.fullyLoadedCostPerRole])

  const locationsLookup = React.useMemo(
    () =>
      Object.fromEntries(
        state.locations.map((location) => [location.id, location.label])
      ),
    [state.locations]
  )

  const rolesByQuarter = React.useMemo(() => {
    const mapping: Record<string, RoleInput[]> = {}
    columnIds.forEach((id) => {
      mapping[id] = []
    })

    state.roles.forEach((role) => {
      const derived = safeQuarterId(role.hiringDate)
      const resolved = ensureQuarterInRange(
        role.quarterPlacement ?? derived,
        columns,
        columns[0]?.id
      )
      mapping[resolved] = [...(mapping[resolved] ?? []), role]
    })

    return mapping
  }, [state.roles, columns, columnIds])

  React.useEffect(() => {
    state.roles.forEach((role) => {
      if (!role.quarterPlacement) {
        const derived = safeQuarterId(role.hiringDate)
        if (derived) {
          updateRole(role.id, {
            quarterPlacement: ensureQuarterInRange(derived, columns, columns[0]?.id),
          })
        }
      }
    })
  }, [state.roles, columns, updateRole])

  const currentQuarterLabel = columns[0] ? getQuarterLabel(columns[0]) : ""
  const nextQuarterLabel = columns[1] ? getQuarterLabel(columns[1]) : ""

  const activeRole = activeRoleId
    ? state.roles.find((role) => role.id === activeRoleId) ?? null
    : null

  if (state.roles.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            Current quarter:{" "}
            <span className="font-medium text-foreground">{currentQuarterLabel}</span>
            {nextQuarterLabel ? ` · Next: ${nextQuarterLabel}` : null}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Multi-quarter plan
        </Badge>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-w-full">
            {columns.map((column) => (
              <QuarterColumnCard
                key={column.id}
                column={column}
                roles={rolesByQuarter[column.id] ?? []}
                activeRoleId={activeRoleId}
                locationsLookup={locationsLookup}
                costLookup={costLookup}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {typeof document !== "undefined" &&
          createPortal(
            <DragOverlay>
              {activeRole && (
                <HireCard
                  role={activeRole}
                  locationsLookup={locationsLookup}
                  costLookup={costLookup}
                  quarterId={
                    ensureQuarterInRange(
                      activeRole.quarterPlacement,
                      columns,
                      columns[0]?.id
                    ) ?? columns[0]?.id
                  }
                  isOverlay
                  formatCurrency={formatCurrency}
                />
              )}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </div>
  )

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as HireCardDragData | undefined
    if (data?.type === "hire-card") {
      setActiveRoleId(data.roleId)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveRoleId(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as HireCardDragData | undefined
    if (activeData?.type !== "hire-card") {
      return
    }

    const destination = getDestinationQuarter(over.data.current as
      | HireCardDragData
      | QuarterColumnDragData
      | undefined)

    if (!destination || destination === activeData.quarterId) {
      return
    }

    updateRole(activeData.roleId, { quarterPlacement: destination })
  }
}

type QuarterColumnCardProps = {
  column: QuarterColumn
  roles: RoleInput[]
  activeRoleId: string | null
  locationsLookup: Record<string, string>
  costLookup: Record<string, number>
  formatCurrency: (value: number) => string
}

function QuarterColumnCard({
  column,
  roles,
  activeRoleId,
  locationsLookup,
  costLookup,
  formatCurrency,
}: QuarterColumnCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "quarter-column",
      columnId: column.id,
    } satisfies QuarterColumnDragData,
  })

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "w-72 min-w-[18rem] border-muted bg-card/80 backdrop-blur-sm flex flex-col",
        isOver && "border-primary shadow-lg"
      )}
    >
      <CardHeader className="py-4">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {column.label}
        </p>
        <p className="text-xs text-muted-foreground">
          {roles.length > 0 ? `${roles.length} hires` : "Drop hires here"}
        </p>
      </CardHeader>
      <CardContent className="pb-4">
        <SortableContext
          items={roles.map((role) => role.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3 min-h-32">
            {roles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 text-center text-xs text-muted-foreground">
                No hires yet
              </div>
            ) : (
              roles.map((role) => (
                <HireCard
                  key={role.id}
                  role={role}
                  locationsLookup={locationsLookup}
                  costLookup={costLookup}
                  quarterId={column.id}
                  isActive={activeRoleId === role.id}
                  formatCurrency={formatCurrency}
                />
              ))
            )}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  )
}

type HireCardProps = {
  role: RoleInput
  locationsLookup: Record<string, string>
  costLookup: Record<string, number>
  quarterId: string
  isActive?: boolean
  isOverlay?: boolean
  formatCurrency: (value: number) => string
}

function HireCard({
  role,
  locationsLookup,
  costLookup,
  quarterId,
  isActive,
  isOverlay,
  formatCurrency,
}: HireCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: role.id,
    disabled: isOverlay,
    data: {
      type: "hire-card",
      roleId: role.id,
      quarterId,
    } satisfies HireCardDragData,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "border bg-background shadow-sm transition-all",
        (isDragging || isOverlay) && "ring-1 ring-primary/40 shadow-lg",
        isActive && "ring-2 ring-primary"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground leading-tight">
              {role.title}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {role.employmentType} · {role.headcount} HC
            </p>
          </div>
          {!isOverlay && (
            <Button
              variant="ghost"
              size="icon"
              {...attributes}
              {...listeners}
              className="h-6 w-6 shrink-0 cursor-grab text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Drag hire</span>
              <GripVertical className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {role.category ? (
            <Badge variant="outline" className="text-[11px]">
              {getCategoryLabel(role.category)}
            </Badge>
          ) : null}
          <Badge variant="secondary" className="text-[11px]">
            {locationsLookup[role.locationId] ?? "Location TBD"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-muted-foreground space-y-2">
        <div className="flex items-center justify-between">
          <span>Start</span>
          <span className="text-foreground font-medium">
            {formatDate(role.hiringDate)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Monthly cost</span>
          <span className="text-foreground font-semibold">
            {formatCurrency(costLookup[role.id] ?? 0)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function getDestinationQuarter(
  data: HireCardDragData | QuarterColumnDragData | undefined
) {
  if (!data) return null
  if (data.type === "hire-card") {
    return data.quarterId
  }
  if (data.type === "quarter-column") {
    return data.columnId
  }
  return null
}

function safeQuarterId(hiringDate?: string) {
  if (!hiringDate) return undefined
  const parsed = new Date(hiringDate)
  if (Number.isNaN(parsed.getTime())) return undefined
  return getQuarterIdFromDate(parsed)
}

function formatDate(dateString: string) {
  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) return "TBD"
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })
}


