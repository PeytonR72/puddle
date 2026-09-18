import type { Specimen } from './specimen-series'

/**
 * Turning a specimen into a drawable trace, and turning a pointer position back
 * into the week it is over.
 *
 * Each specimen is scaled inside its own range rather than against a shared
 * one. Coffee's weekly mean runs roughly 2.6x Tea's, so one scale flattens Tea
 * onto its baseline and pushes Coffee out of its band, and the sheet's claim
 * is that every specimen is legible, not that they share an axis. The mean and
 * range are printed beside each trace so the scaling is stated rather than
 * hidden.
 */
export type TracePoint = {
  readonly x: number
  readonly y: number
}

export type SpecimenPlot = {
  readonly category: string
  readonly points: readonly TracePoint[]
  readonly low: number
  readonly high: number
  readonly mean: number
}

/**
 * Points in a unit box: x runs 0→1 across the weeks, y runs 0 at the specimen's
 * own minimum to 1 at its own maximum. The caller owns the pixel box, so the
 * same plot serves the sheet at any width without recomputing.
 */
export function plotSpecimen(specimen: Specimen): SpecimenPlot {
  const { weeks } = specimen
  const low = Math.min(...weeks)
  const high = Math.max(...weeks)
  const span = high - low
  const lastIndex = Math.max(1, weeks.length - 1)

  return {
    category: specimen.category,
    points: weeks.map((value, index) => ({
      x: index / lastIndex,
      // A flat specimen would divide by zero; it sits on its baseline instead.
      y: span === 0 ? 0 : (value - low) / span,
    })),
    low,
    high,
    mean: weeks.reduce((total, value) => total + value, 0) / weeks.length,
  }
}

/**
 * Which week a pointer at `fraction` across the field is over. Clamped, because
 * a pointer can leave the field mid-drag and the reading should hold at the end
 * of the specimen rather than disappear or wrap.
 */
export function weekAt(weekCount: number, fraction: number): number {
  if (weekCount <= 0) return 0
  const clamped = Math.min(1, Math.max(0, fraction))
  return Math.min(weekCount - 1, Math.round(clamped * (weekCount - 1)))
}

/**
 * The first date of a given week, counting from the dataset's first day. The
 * determination label names a date rather than a week number: a reader knows
 * what 2024-03-04 means and has to be taught what week 9 means.
 */
export function weekStartDate(firstDate: string, weekIndex: number): string {
  const start = new Date(`${firstDate}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() + weekIndex * 7)
  const iso = start.toISOString()
  return iso.slice(0, iso.indexOf('T'))
}
