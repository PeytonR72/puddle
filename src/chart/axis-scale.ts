/**
 * The y axis: where it starts, where it stops, and which values get a tick.
 *
 * Recharts will size an axis on its own, and what it produces is the exact
 * extent of the data cut into equal parts — ticks at 950, 1,900, 2,850. Those
 * are true numbers and useless landmarks. A reader uses ticks to estimate the
 * values that are not labelled, which only works if the ticks are numbers they
 * can do arithmetic with, so the steps here are the round ones: 1, 2 or 5 times
 * a power of ten.
 *
 * **A bar starts at zero and a line does not.** A bar encodes its value as a
 * length, so a baseline anywhere else overstates every difference on the plot —
 * that one is not a preference. A line encodes value as position, where the
 * zero is not doing any work: a column of temperatures between 18 and 24 drawn
 * against a zero baseline is a flat line with all of its signal squeezed out.
 * Switching between the two rescales the plot, which is the honest outcome —
 * the two marks can claim different things, and the axis says so.
 */
import type { ChartPoint } from './chart-series'

export type AxisScale = {
  domain: [number, number]
  ticks: number[]
}

/** About as many landmarks as a short plot holds before they crowd. */
const TARGET_TICKS = 5

/** A hard stop, so a domain that defeats the arithmetic cannot spin. */
const MAX_TICKS = 24

export type ScaleOptions = {
  /** Bars need it. Lines are better off without it. */
  includeZero: boolean
}

/** `null` when there is no number in the series to scale against. */
export function niceScale(
  points: readonly ChartPoint[],
  { includeZero }: ScaleOptions,
): AxisScale | null {
  const values = points.flatMap((point) => (point.value === null ? [] : [point.value]))

  if (values.length === 0) {
    return null
  }

  let low = Math.min(...values)
  let high = Math.max(...values)

  if (includeZero) {
    low = Math.min(low, 0)
    high = Math.max(high, 0)
  }

  // One value, or a column of identical ones: there is no span to divide, so
  // one is borrowed from the value's own magnitude.
  if (low === high) {
    const reach = Math.abs(high) || 1

    if (includeZero) {
      low = Math.min(0, high)
      high = Math.max(0, high)
    }

    if (low === high) {
      low -= reach
      high += reach
    }
  }

  const step = niceStep((high - low) / TARGET_TICKS)
  const first = Math.floor(low / step) * step
  const last = Math.ceil(high / step) * step

  const ticks: number[] = []

  for (let tick = first; tick <= last + step / 2 && ticks.length < MAX_TICKS; tick += step) {
    // Stepping by a float accumulates drift — 0.1 + 0.2 is famously not 0.3 —
    // so each tick is rounded back onto the step it was supposed to land on.
    ticks.push(roundToStep(tick, step))
  }

  return { domain: [first, last], ticks }
}

/**
 * The nearest round number at or above a rough step: 1, 2 or 5 times a power of
 * ten. Any other multiplier gives ticks nobody counts in.
 */
function niceStep(rough: number): number {
  if (!Number.isFinite(rough) || rough <= 0) {
    return 1
  }

  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const normalized = rough / magnitude

  if (normalized <= 1) {
    return magnitude
  }

  if (normalized <= 2) {
    return 2 * magnitude
  }

  if (normalized <= 5) {
    return 5 * magnitude
  }

  return 10 * magnitude
}

function roundToStep(value: number, step: number): number {
  const rounded = Math.round(value / step) * step

  // A step under 1 leaves the result with the step's own decimal noise.
  return Number(rounded.toPrecision(12))
}
