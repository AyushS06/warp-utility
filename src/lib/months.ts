export type MonthDescriptor = {
  year: number
  month: number // 0-11 (JavaScript month index)
}

export type MonthColumn = MonthDescriptor & {
  id: string
  label: string
}

export function getMonthFromDate(date: Date): MonthDescriptor {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
  }
}

export function getMonthId(descriptor: MonthDescriptor): string {
  return `${descriptor.year}-${String(descriptor.month + 1).padStart(2, "0")}`
}

export function getMonthLabel(descriptor: MonthDescriptor): string {
  const date = new Date(descriptor.year, descriptor.month, 1)
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

export function parseMonthId(id: string): MonthDescriptor | null {
  const match = id.match(/^(\d{4})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1 // Convert to 0-based month index
  if (month < 0 || month > 11) return null
  return { year, month }
}

export function getColumnsForMonths(
  startYear: number,
  startMonth: number, // 0-11
  endYear: number,
  endMonth: number // 0-11
): MonthColumn[] {
  const columns: MonthColumn[] = []
  let currentYear = startYear
  let currentMonth = startMonth

  while (
    currentYear < endYear ||
    (currentYear === endYear && currentMonth <= endMonth)
  ) {
    const descriptor: MonthDescriptor = {
      year: currentYear,
      month: currentMonth,
    }
    const date = new Date(currentYear, currentMonth, 1)
    columns.push({
      ...descriptor,
      id: getMonthId(descriptor),
      label: getMonthLabel(descriptor),
    })

    currentMonth += 1
    if (currentMonth > 11) {
      currentMonth = 0
      currentYear += 1
    }
  }

  return columns
}

export function getMonthIdFromDate(date: Date): string {
  return getMonthId(getMonthFromDate(date))
}

export function ensureMonthInRange(
  monthId: string | undefined,
  allowedColumns: MonthColumn[],
  fallbackId?: string
): string {
  if (monthId && allowedColumns.some((column) => column.id === monthId)) {
    return monthId
  }
  return fallbackId ?? allowedColumns[0]?.id ?? getMonthIdFromDate(new Date())
}

