/**
 * The result, reduced to the points a chart can draw.
 *
 * Two things this deliberately does not do:
 *
 * - **It does not group.** One row is one point, in the order the query
 *   returned them. SQL already has `GROUP BY` and `ORDER BY`, and a chart that
 *   silently re-aggregates its input is showing a number nobody asked for.
 * - **It does not fill gaps.** A `NULL` stays a hole (`value: null`), so a line
 *   breaks across it rather than drawing a segment between two readings that
 *   have nothing in between.
 */
import type { Column, Result, ResultValue, Row } from '../duckdb/client'
import { formatCell } from '../results/cell-format'
import type { ChartAxes } from './chart-axes'

export type ChartPoint = {
  /** The x column's value, formatted exactly as the grid above formats it. */
  label: string
  /** `null` where the row had no number there. */
  value: number | null
}

export type ChartSeries = {
  points: ChartPoint[]
  /** Rows the result holds, which is not always the number of points drawn. */
  rowCount: number
  /** Whether the tail of the result was left out of the picture. */
  isTruncated: boolean
}

/**
 * How many rows get drawn.
 *
 * The grid above is virtualized and a chart is not: every point is an SVG node
 * that stays in the document whether or not it is legible. At a few hundred
 * bars the marks are already thinner than the gaps between them, so the cap is
 * set where the picture stops improving rather than where the browser starts
 * struggling. Past it the chart says how many rows it drew, because a shape
 * that silently describes the first 500 of 100,000 rows is a lie about the data.
 */
export const MAX_POINTS = 500

export function chartSeries(result: Result, axes: ChartAxes): ChartSeries {
  const x = result.columns[axes.x.index]
  const y = result.columns[axes.y.index]

  if (x === undefined || y === undefined) {
    return { points: [], rowCount: result.rowCount, isTruncated: false }
  }

  const drawn = result.rows.slice(0, MAX_POINTS)

  return {
    points: drawn.map((row) => toPoint(row, x, axes)),
    rowCount: result.rowCount,
    isTruncated: result.rows.length > drawn.length,
  }
}

function toPoint(row: Row, x: Column, axes: ChartAxes): ChartPoint {
  return {
    label: formatCell(row[axes.x.index] ?? null, x.kind).text,
    value: toPlottable(row[axes.y.index] ?? null),
  }
}

/**
 * One cell, as a height.
 *
 * A `BIGINT` past 2^53 loses its last digits on the way through `Number`, which
 * is a real loss and not one a chart can show: the difference is far under a
 * pixel. The grid above prints the exact value, so nothing is hidden: this is
 * the picture, not the record.
 */
function toPlottable(value: ResultValue): number | null {
  if (typeof value === 'bigint') {
    return Number(value)
  }

  // NaN and Infinity are what a division by zero leaves behind. Neither has a
  // height, and both would take the whole y axis with them.
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  return null
}

/** Whether there is any height at all to draw, once the nulls are counted out. */
export function hasPlottableValue(points: readonly ChartPoint[]): boolean {
  return points.some((point) => point.value !== null)
}
