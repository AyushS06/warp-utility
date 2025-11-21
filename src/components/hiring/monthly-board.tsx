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
import { GripVertical, ChevronDown, Trash2 } from "lucide-react"

import { useCalculator } from "@/contexts/calculator-context"
import type { RoleInput } from "@/lib/types"
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency"
import {
  ensureMonthInRange,
  getColumnsForMonths,
  getMonthIdFromDate,
  getMonthLabel,
  parseMonthId,
  type MonthColumn,
} from "@/lib/months"
import { getCategoryLabel } from "@/lib/role-categories"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { EditRoleSettings } from "@/components/hiring/edit-role-settings"

type HireCardDragData = {
  type: "hire-card"
  roleId: string
  monthId: string
}

type MonthColumnDragData = {
  type: "month-column"
  columnId: string
}

export function MonthlyHiringBoard() {
  const { state, updateRole, removeRole } = useCalculator()
  
  const formatCurrency = React.useCallback(
    (value: number) => {
      if (!value) return formatCurrencyUtil(0, state.currency)
      return formatCurrencyUtil(value, state.currency)
    },
    [state.currency]
  )
  
  // November 2025 (month 10, 0-indexed) to November 2027 (month 10, 0-indexed)
  const columns = React.useMemo(
    () => getColumnsForMonths(2025, 10, 2027, 10),
    []
  )
  const columnIds = React.useMemo(() => columns.map((column) => column.id), [columns])
  const [activeRoleId, setActiveRoleId] = React.useState<string | null>(null)
  const [datePickerRoleId, setDatePickerRoleId] = React.useState<string | null>(null)
  const [editSettingsRoleId, setEditSettingsRoleId] = React.useState<string | null>(null)
  const [deleteConfirmRoleId, setDeleteConfirmRoleId] = React.useState<string | null>(null)

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

  const rolesByMonth = React.useMemo(() => {
    const mapping: Record<string, RoleInput[]> = {}
    columnIds.forEach((id) => {
      mapping[id] = []
    })

    state.roles.forEach((role) => {
      const derived = safeMonthId(role.hiringDate)
      const resolved = ensureMonthInRange(
        role.monthPlacement ?? derived,
        columns,
        columns[0]?.id
      )
      mapping[resolved] = [...(mapping[resolved] ?? []), role]
    })

    return mapping
  }, [state.roles, columns, columnIds])

  React.useEffect(() => {
    state.roles.forEach((role) => {
      if (!role.monthPlacement) {
        const derived = safeMonthId(role.hiringDate)
        if (derived) {
          updateRole(role.id, {
            monthPlacement: ensureMonthInRange(derived, columns, columns[0]?.id),
          })
        }
      }
    })
  }, [state.roles, columns, updateRole])

  const activeRole = activeRoleId
    ? state.roles.find((role) => role.id === activeRoleId) ?? null
    : null

  const datePickerRole = datePickerRoleId
    ? state.roles.find((role) => role.id === datePickerRoleId) ?? null
    : null

  if (state.roles.length === 0) {
    return <div className="space-y-4 p-4 text-center text-muted-foreground text-sm">No roles to display</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            Drag engineers into the month they will start. Click a card to set a precise date.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Monthly plan
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
              <MonthColumnCard
                key={column.id}
                column={column}
                roles={rolesByMonth[column.id] ?? []}
                activeRoleId={activeRoleId}
                locationsLookup={locationsLookup}
                costLookup={costLookup}
                onCardClick={(roleId) => setDatePickerRoleId(roleId)}
                onSalaryClick={(roleId) => setEditSettingsRoleId(roleId)}
                onDeleteClick={(roleId) => setDeleteConfirmRoleId(roleId)}
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
                  monthId={
                    ensureMonthInRange(
                      activeRole.monthPlacement,
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

      {datePickerRole && (
        <DatePickerDialog
          role={datePickerRole}
          open={datePickerRoleId === datePickerRole.id}
          onOpenChange={(open) => {
            if (!open) {
              setDatePickerRoleId(null)
            }
          }}
          onDateChange={(date) => {
            const monthId = getMonthIdFromDate(date)
            updateRole(datePickerRole.id, {
              hiringDate: date.toISOString().split("T")[0],
              monthPlacement: ensureMonthInRange(monthId, columns, columns[0]?.id),
            })
            setDatePickerRoleId(null)
          }}
        />
      )}

      {editSettingsRoleId && (
        <EditRoleSettings
          role={state.roles.find((r) => r.id === editSettingsRoleId)!}
          open={editSettingsRoleId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditSettingsRoleId(null)
            }
          }}
        />
      )}

      {deleteConfirmRoleId && (
        <DeleteConfirmDialog
          role={state.roles.find((r) => r.id === deleteConfirmRoleId)!}
          open={deleteConfirmRoleId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteConfirmRoleId(null)
            }
          }}
          onConfirm={() => {
            removeRole(deleteConfirmRoleId)
            setDeleteConfirmRoleId(null)
          }}
        />
      )}
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

    const destination = getDestinationMonth(over.data.current as
      | HireCardDragData
      | MonthColumnDragData
      | undefined)

    if (!destination || destination === activeData.monthId) {
      return
    }

    // When dragging and dropping, always set to the 1st of the target month
    // This ensures the date shows as "Month Year" format (e.g., "Feb 2026")
    const monthDescriptor = parseMonthId(destination)
    if (monthDescriptor) {
      // Create date for the 1st of the target month (month is 0-indexed in JavaScript)
      // Format as YYYY-MM-DD for storage (e.g., "2026-02-01" for Feb 1, 2026)
      const monthNum = String(monthDescriptor.month + 1).padStart(2, "0")
      const dateString = `${monthDescriptor.year}-${monthNum}-01`
      
      updateRole(activeData.roleId, {
        hiringDate: dateString,
        monthPlacement: destination,
      })
    }
  }
}

type MonthColumnCardProps = {
  column: MonthColumn
  roles: RoleInput[]
  activeRoleId: string | null
  locationsLookup: Record<string, string>
  costLookup: Record<string, number>
  onCardClick: (roleId: string) => void
  onSalaryClick: (roleId: string) => void
  onDeleteClick: (roleId: string) => void
  formatCurrency: (value: number) => string
}

function MonthColumnCard({
  column,
  roles,
  activeRoleId,
  locationsLookup,
  costLookup,
  onCardClick,
  onSalaryClick,
  onDeleteClick,
  formatCurrency,
}: MonthColumnCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "month-column",
      columnId: column.id,
    } satisfies MonthColumnDragData,
  })

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "w-64 min-w-[16rem] border-muted bg-card/80 backdrop-blur-sm flex flex-col",
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
                  monthId={column.id}
                  isActive={activeRoleId === role.id}
                  onCardClick={() => onCardClick(role.id)}
                  onSalaryClick={() => onSalaryClick(role.id)}
                  onDeleteClick={() => onDeleteClick(role.id)}
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
  monthId: string
  isActive?: boolean
  isOverlay?: boolean
  onCardClick?: () => void
  onSalaryClick?: () => void
  onDeleteClick?: () => void
  formatCurrency: (value: number) => string
}

function HireCard({
  role,
  locationsLookup,
  costLookup,
  monthId,
  isActive,
  isOverlay,
  onCardClick,
  onSalaryClick,
  onDeleteClick,
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
      monthId,
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
        "border bg-background shadow-sm transition-all cursor-pointer",
        (isDragging || isOverlay) && "ring-1 ring-primary/40 shadow-lg",
        isActive && "ring-2 ring-primary",
        !isOverlay && "hover:shadow-md"
      )}
      onClick={!isOverlay ? onCardClick : undefined}
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
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteClick?.()
                }}
              >
                <span className="sr-only">Delete role</span>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                {...attributes}
                {...listeners}
                className="h-6 w-6 shrink-0 cursor-grab text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Drag hire</span>
                <GripVertical className="h-4 w-4" />
              </Button>
            </div>
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
          {!isOverlay ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCardClick?.()
              }}
              className="flex items-center gap-0.5 hover:opacity-80 transition-opacity"
            >
              <span className="text-foreground font-semibold">
                {formatDate(role.hiringDate)}
              </span>
              <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
          ) : (
            <span className="text-foreground font-semibold">
              {formatDate(role.hiringDate)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span>Monthly cost</span>
          {!isOverlay ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSalaryClick?.()
              }}
              className="flex items-center gap-0.5 hover:opacity-80 transition-opacity"
            >
              <span className="text-foreground font-semibold">
                {formatCurrency(costLookup[role.id] ?? 0)}
              </span>
              <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
          ) : (
            <span className="text-foreground font-semibold">
              {formatCurrency(costLookup[role.id] ?? 0)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

type DatePickerDialogProps = {
  role: RoleInput
  open: boolean
  onOpenChange: (open: boolean) => void
  onDateChange: (date: Date) => void
}

function DatePickerDialog({
  role,
  open,
  onOpenChange,
  onDateChange,
}: DatePickerDialogProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    role.hiringDate ? new Date(role.hiringDate) : undefined
  )

  React.useEffect(() => {
    if (open && role.hiringDate) {
      setSelectedDate(new Date(role.hiringDate))
    }
  }, [open, role.hiringDate])

  const handleConfirm = () => {
    if (selectedDate) {
      onDateChange(selectedDate)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select start date</DialogTitle>
          <DialogDescription>
            Choose the precise start date for {role.title}. The card will move to the corresponding month.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            initialFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedDate}>
              Confirm
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getDestinationMonth(
  data: HireCardDragData | MonthColumnDragData | undefined
) {
  if (!data) return null
  if (data.type === "hire-card") {
    return data.monthId
  }
  if (data.type === "month-column") {
    return data.columnId
  }
  return null
}

function safeMonthId(hiringDate?: string) {
  if (!hiringDate) return undefined
  const parsed = new Date(hiringDate)
  if (Number.isNaN(parsed.getTime())) return undefined
  return getMonthIdFromDate(parsed)
}

function formatDate(dateString: string): string {
  if (!dateString) return "TBD"
  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) return "TBD"
  
  // Always show full date format: "Feb 1, 2026" or "Feb 14, 2026"
  return format(parsed, "MMM d, yyyy")
}


type DeleteConfirmDialogProps = {
  role: RoleInput
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

function DeleteConfirmDialog({
  role,
  open,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove role from hiring plan?</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{role.title}</strong> from your hiring plan? This action cannot be undone and will update all metrics accordingly.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


