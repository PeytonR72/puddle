/**
 * What the axes are allowed to say, and how much room the y axis needs to say it.
 *
 * Both answers are arithmetic for the same reason the results grid's widths are
 * (`src/results/column-width.ts`): the face is monospace, so a character count
 * is a width, and the chart has to reserve the gutter before it knows which
 * ticks it will draw.
 */
import { groupDigits } from '../results/cell-format'
import { TICK_MARGIN } from './marks'

/** Advance of one character at `--text-micro` (11px), which is what a tick is set in. */
const TICK_CHAR_WIDTH = 6.7

/**
 * How long an x tick may be before it is shortened.
 *
 * A category axis hands its labels whatever the column held, and a column of
 * URLs would otherwise draw every tick over its neighbours. Twelve characters
 * is about what one tick's share of a narrow plot holds.
 */
export const MAX_TICK_CHARS = 12

const ELLIPSIS = '…'

/**
 * A label that fits, with the shortening made visible.
 *
 * The ellipsis is the point: the grid above truncates a wide cell the same way,
 * and a reader who can see that a label was cut knows to look at the tooltip or
 * the row. A label quietly clipped by the edge of its slot reads as the whole
 * value.
 */
export function truncateLabel(text: string, max: number = MAX_TICK_CHARS): string {
  if (max <= 0) {
    return ''
  }

  return text.length <= max ? text : `${text.slice(0, max - 1)}${ELLIPSIS}`
}

/**
 * A number, as a y tick.
 *
 * Grouped like every other number in Puddle, and rounded — which the cells in
 * the grid above are emphatically not. An axis is a scale rather than a record:
 * `0.30000000000000004` is a true value and a useless tick, and the exact one
 * is a glance away in the row it came from.
 */
export function formatTick(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value)
  }

  if (Number.isInteger(value)) {
    return groupDigits(String(value))
  }

  // Under 1, the significant digits are all after the point, so rounding to a
  // fixed number of places would flatten a small domain to a column of zeros.
  const rounded = Math.abs(value) < 1 ? Number(value.toPrecision(4)) : Number(value.toFixed(4))

  return groupDigits(String(rounded))
}

const COMPACT_UNITS: readonly [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
]

/**
 * A big number, short.
 *
 * `20,000,000,000` is fourteen characters of gutter for one landmark, and four
 * ticks of it is a quarter of the plot spent on zeros. The compact form says
 * the same thing about the scale in a quarter of the room, and the exact value
 * is still a row away in the grid above.
 */
export function compactTick(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value)
  }

  const magnitude = Math.abs(value)

  for (const [size, suffix] of COMPACT_UNITS) {
    if (magnitude >= size) {
      return `${Number((value / size).toFixed(1))}${suffix}`
    }
  }

  return formatTick(value)
}

/** Narrow enough not to steal the plot, wide enough for a tick of four digits. */
export const MIN_Y_AXIS_WIDTH = 44

/**
 * How long a y tick may be before the whole axis switches to the compact form.
 *
 * A ceiling on the gutter rather than on the label, because the failure it
 * prevents is the plot being squeezed by its own scale. Twelve characters is
 * `-1,234,567.8` — past that the exact digits stop being worth their room.
 */
export const MAX_Y_TICK_CHARS = 12

/** What the y axis will say, and the gutter it needs to say it. */
export type YAxisLabels = {
  format: (value: number) => string
  width: number
}

/**
 * The y axis, measured from the ticks it will actually draw.
 *
 * The chart chooses its ticks before it is laid out (`axis-scale.ts`), so this
 * is an exact measurement rather than an estimate of one — the only guess left
 * is the character advance, which is the same guess the results grid makes
 * about its columns.
 *
 * The choice between exact and compact is made **once, for the whole axis**. An
 * axis reading 500,000 · 1M · 1,500,000 describes its own scale in two
 * vocabularies and makes the reader convert between them mid-glance.
 */
export function yAxisLabels(ticks: readonly number[]): YAxisLabels {
  const exact = ticks.map(formatTick)
  const isCompact = exact.some((label) => label.length > MAX_Y_TICK_CHARS)
  const format = isCompact ? compactTick : formatTick
  const labels = isCompact ? ticks.map(compactTick) : exact

  const widest = labels.reduce((widest, label) => Math.max(widest, label.length), 0)

  if (widest === 0) {
    return { format, width: MIN_Y_AXIS_WIDTH }
  }

  return { format, width: Math.max(gutterFor(widest), MIN_Y_AXIS_WIDTH) }
}

function gutterFor(characters: number): number {
  return Math.ceil(characters * TICK_CHAR_WIDTH) + TICK_MARGIN + TICK_SLACK
}

/**
 * A few pixels over the arithmetic.
 *
 * The advance above is measured — 6.60px in Chromium's mono at 11px — but the
 * face varies by system, and the two outcomes are not symmetric: a gutter a few
 * pixels too wide is invisible, and one a few pixels too narrow shears the
 * first digit off every tick.
 */
const TICK_SLACK = 4
