/**
 * Which two columns the chart draws, and which ones the reader may choose from.
 *
 * Axis choice reads `Column.kind` and never the values under it. The kinds were
 * earned once, at the boundary in `src/duckdb/result.ts`, and re-deriving a type
 * by sniffing a column of strings is how a chart ends up plotting `"00123"` as a
 * number — or worse, plotting it as one in a result where the next row is `"n/a"`.
 *
 * A column is remembered by index *and* name because neither alone survives the
 * next query. An index outlives a rename into a different column; a name is not
 * unique, since `SELECT 1 AS a, 2 AS a` returns two columns called `a`. Holding
 * both means a reader's choice of y survives editing the `WHERE` clause and is
 * dropped when it stops making sense.
 */
import type { Column, ColumnKind } from '../duckdb/client'

/** A column the reader picked, remembered by where it sat and what it was called. */
export type AxisChoice = {
  index: number
  name: string
}

export type ChartAxes = {
  x: AxisChoice
  y: AxisChoice
}

/** What each select offers, in column order. */
export type AxisOptions = {
  x: AxisChoice[]
  y: AxisChoice[]
}

/**
 * What the reader has asked for, where they have asked for anything.
 *
 * `null` on an axis means "whatever was inferred" rather than "no column", so a
 * result that changes shape falls back rather than blanking the chart.
 */
export type AxisOverride = {
  x: AxisChoice | null
  y: AxisChoice | null
}

export const NO_OVERRIDE: AxisOverride = { x: null, y: null }

/**
 * Whether a column can be a height.
 *
 * Only the two numeric kinds. A `DATE` also arrives as a JS number (epoch
 * milliseconds) and would plot without complaint as a bar 1.7 trillion units
 * tall, so the kind is what decides, not the runtime type.
 */
export function isPlottable(kind: ColumnKind): boolean {
  return kind === 'number' || kind === 'bigint'
}

/**
 * Temporal kinds, which a chart reads in order.
 *
 * `TIME` is in here with the two date kinds: it is the same argument — a column
 * of moments is already sorted by the axis it would be drawn on.
 */
function isTemporal(kind: ColumnKind): boolean {
  return kind === 'date' || kind === 'timestamp' || kind === 'time'
}

function toChoice(column: Column, index: number): AxisChoice {
  return { index, name: column.name }
}

/**
 * The two column lists the selects are built from.
 *
 * Every column can label a point, so x offers all of them. Only a number can be
 * a height, so y offers the numeric ones — an axis of `VARCHAR` is not a choice
 * to leave open and then refuse.
 */
export function axisOptions(columns: readonly Column[]): AxisOptions {
  return {
    x: columns.map(toChoice),
    y: columns.flatMap((column, index) => (isPlottable(column.kind) ? [toChoice(column, index)] : [])),
  }
}

/**
 * The chart's opening guess, or `null` when the result holds nothing to plot.
 *
 * y is the first numeric column and x is the first date, then the first string,
 * then whatever is left. The order is the order a result set usually arrives in
 * — `SELECT day, region, revenue` is the shape of almost every query anyone
 * writes against a CSV, and reading it left to right lands on the right pair.
 */
export function inferAxes(columns: readonly Column[]): ChartAxes | null {
  const y = columns.findIndex((column) => isPlottable(column.kind))
  const yColumn = columns[y]

  if (yColumn === undefined) {
    return null
  }

  const x = firstIndexOf(columns, isTemporal) ?? firstIndexOf(columns, (kind) => kind === 'string')
  // Nothing to label the points with but another number. The first column that
  // is not already the height is a better x than repeating the height, and on a
  // single-column result there is nothing else, so the height labels itself.
  const fallback = columns.findIndex((_, index) => index !== y)
  const chosen = x ?? (fallback === -1 ? y : fallback)
  const xColumn = columns[chosen]

  if (xColumn === undefined) {
    return null
  }

  return { x: toChoice(xColumn, chosen), y: toChoice(yColumn, y) }
}

function firstIndexOf(
  columns: readonly Column[],
  matches: (kind: ColumnKind) => boolean,
): number | null {
  const index = columns.findIndex((column) => matches(column.kind))

  return index === -1 ? null : index
}

/**
 * The axes to draw: what the reader chose, where it still exists, and the
 * inferred pair everywhere else.
 *
 * A choice is honoured when the column is still where it was, and failing that
 * when a column of the same name is still somewhere. Editing a query and
 * running it again should not quietly move the y axis back off the column
 * somebody picked — but a choice that no longer names anything has to go, or
 * the chart draws a column that is not in the result.
 */
export function resolveAxes(
  columns: readonly Column[],
  override: AxisOverride,
): ChartAxes | null {
  const inferred = inferAxes(columns)

  if (inferred === null) {
    return null
  }

  return {
    x: locate(columns, override.x) ?? inferred.x,
    y: locate(columns, override.y, isPlottable) ?? inferred.y,
  }
}

function locate(
  columns: readonly Column[],
  choice: AxisChoice | null,
  allowed: (kind: ColumnKind) => boolean = () => true,
): AxisChoice | null {
  if (choice === null) {
    return null
  }

  const atIndex = columns[choice.index]

  if (atIndex !== undefined && atIndex.name === choice.name && allowed(atIndex.kind)) {
    return { index: choice.index, name: atIndex.name }
  }

  const moved = columns.findIndex(
    (column) => column.name === choice.name && allowed(column.kind),
  )

  return moved === -1 ? null : { index: moved, name: choice.name }
}
