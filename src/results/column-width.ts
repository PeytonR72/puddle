/**
 * How wide each column of a result is drawn.
 *
 * The grid is virtualized in both directions, so every column needs a width
 * before anything is laid out: there is no pass where the browser gets to look
 * at the content and decide. That rules out `table-layout: auto`, and it means
 * these numbers are an estimate by construction.
 *
 * Estimating is cheap here because the face is monospace (`docs/design/tokens.md`):
 * every glyph is the same advance, so a character count is a width. The one thing
 * that is genuinely guessed is the advance itself, which varies by a fraction of
 * a pixel between system faces. Columns are therefore sized a touch generously
 * rather than exactly, because a column that is 4px too wide is invisible and one
 * that is 4px too narrow clips its last digit.
 */
import type { Column, Row } from '../duckdb/client'
import { formatCell } from './cell-format'
import { sqlTypeName } from './type-name'

/** Advance of one character at `--text-base` (13px) in the mono stack. */
const CELL_CHAR_WIDTH = 7.9

/** The same, at `--text-micro` (11px), which is what the header's type name is set in. */
const TYPE_CHAR_WIDTH = 6.7

/** `px-3` on both sides of a cell, plus a pixel of slack for the rounding. */
const CELL_PADDING = 25

/**
 * Narrow enough that a table of booleans is not mostly whitespace, wide enough
 * that a column header is readable rather than an abbreviation.
 */
export const MIN_COLUMN_WIDTH = 104

/**
 * A ceiling, not a fit. Past this a cell truncates and offers the full value on
 * hover or tap, because one paragraph-shaped column would otherwise push every
 * other column off the screen, and the columns you cannot see are the ones you
 * came to compare.
 */
export const MAX_COLUMN_WIDTH = 380

/**
 * How many rows are looked at to size a column.
 *
 * A sample, not the whole result: sizing 100k rows by measuring 100k strings
 * spends the frame budget the virtualizer exists to save. Rows past the sample
 * that run wider truncate like any other overflow.
 */
export const WIDTH_SAMPLE_ROWS = 120

export function estimateTextWidth(text: string): number {
  return text.length * CELL_CHAR_WIDTH
}

/** Whether a cell's text draws inside its column, or gets clipped by it. */
export function fitsColumn(text: string, width: number): boolean {
  return estimateTextWidth(text) <= width - CELL_PADDING
}

type ColumnMeasurement = {
  name: string
  type: string
  values: readonly string[]
}

export function measureColumnWidth({ name, type, values }: ColumnMeasurement): number {
  // The header stacks the name over the type, so the wider of the two sets the
  // floor rather than their sum.
  const header = Math.max(estimateTextWidth(name), type.length * TYPE_CHAR_WIDTH)

  const widest = values.reduce((widest, value) => Math.max(widest, estimateTextWidth(value)), header)

  return clamp(Math.ceil(widest + CELL_PADDING), MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH)
}

/** One width per column, in column order. */
export function resultColumnWidths(columns: readonly Column[], rows: readonly Row[]): number[] {
  const sample = rows.slice(0, WIDTH_SAMPLE_ROWS)

  return columns.map((column, position) => {
    const values = sample.map((row) => formatCell(row[position] ?? null, column.kind).text)

    // The header's own spelling of the type, not the engine's: `TIMESTAMP` is
    // eleven characters narrower than `Timestamp<MICROSECOND>`.
    return measureColumnWidth({ name: column.name, type: sqlTypeName(column.type), values })
  })
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high)
}
