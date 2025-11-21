const QUARTERS_PER_YEAR = 4 as const

export type QuarterNumber = 1 | 2 | 3 | 4

export type QuarterDescriptor = {
  year: number
  quarter: QuarterNumber
}

export type QuarterColumn = QuarterDescriptor & {
  id: string
  label: string
}

function clampQuarter(value: number): QuarterNumber {
  const normalized = ((Math.floor(value) - 1 + QUARTERS_PER_YEAR) % QUARTERS_PER_YEAR) + 1
  return (normalized || 1) as QuarterNumber
}

export function getQuarterFromDate(date: Date): QuarterDescriptor {
  const quarter = clampQuarter(Math.floor(date.getMonth() / 3) + 1)
  return {
    year: date.getFullYear(),
    quarter,
  }
}

export function getQuarterId(descriptor: QuarterDescriptor): string {
  return `${descriptor.year}-Q${descriptor.quarter}`
}

export function getQuarterLabel(descriptor: QuarterDescriptor): string {
  return `Q${descriptor.quarter} ${descriptor.year}`
}

export function parseQuarterId(id: string): QuarterDescriptor | null {
  const match = id.match(/^(\d{4})-Q([1-4])$/)
  if (!match) return null
  const year = Number(match[1])
  const quarter = Number(match[2]) as QuarterNumber
  return { year, quarter }
}

export function getColumnsForYears(
  years: number,
  startDate = new Date()
): QuarterColumn[] {
  const columns: QuarterColumn[] = []
  const totalQuarters = Math.max(1, years) * QUARTERS_PER_YEAR
  const start = getQuarterFromDate(startDate)
  let currentQuarter = start.quarter
  let currentYear = start.year

  for (let index = 0; index < totalQuarters; index += 1) {
    const descriptor: QuarterDescriptor = {
      year: currentYear,
      quarter: currentQuarter as QuarterNumber,
    }
    columns.push({
      ...descriptor,
      id: getQuarterId(descriptor),
      label: getQuarterLabel(descriptor),
    })
    currentQuarter = ((currentQuarter % QUARTERS_PER_YEAR) + 1) as QuarterNumber
    if (currentQuarter === 1) {
      currentYear += 1
    }
  }

  return columns
}

export function getQuarterIdFromDate(date: Date): string {
  return getQuarterId(getQuarterFromDate(date))
}

export function ensureQuarterInRange(
  quarterId: string | undefined,
  allowedColumns: QuarterColumn[],
  fallbackId?: string
): string {
  if (quarterId && allowedColumns.some((column) => column.id === quarterId)) {
    return quarterId
  }
  return fallbackId ?? allowedColumns[0]?.id ?? getQuarterIdFromDate(new Date())
}

