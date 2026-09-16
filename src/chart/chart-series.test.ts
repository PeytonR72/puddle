import { describe, expect, it } from 'vitest'

import type { Column, Result, Row } from '../duckdb/client'
import type { ChartAxes } from './chart-axes'
import { chartSeries, hasPlottableValue, MAX_POINTS } from './chart-series'

const column = (name: string, type: string, kind: Column['kind']): Column => ({ name, type, kind })

const axes: ChartAxes = { x: { index: 0, name: 'day' }, y: { index: 1, name: 'revenue' } }

const result = (columns: Column[], rows: Row[]): Result => ({
  columns,
  rows,
  rowCount: rows.length,
  durationMs: 7,
})

const dayAndRevenue = [column('day', 'VARCHAR', 'string'), column('revenue', 'DOUBLE', 'number')]

describe('chartSeries', () => {
  it('draws one point per row, in the order the query returned them', () => {
    const series = chartSeries(
      result(dayAndRevenue, [
        ['Mon', 12],
        ['Tue', 9],
      ]),
      axes,
    )

    expect(series.points).toEqual([
      { label: 'Mon', value: 12 },
      { label: 'Tue', value: 9 },
    ])
  })

  it('labels a point with the same string the grid puts in the cell', () => {
    const columns = [column('day', 'DATE', 'date'), column('revenue', 'DOUBLE', 'number')]
    // Epoch milliseconds for 2026-09-16, which is what a DATE arrives as.
    const series = chartSeries(result(columns, [[1_789_516_800_000, 4]]), axes)

    expect(series.points[0]?.label).toBe('2026-09-16')
  })

  it('keeps a NULL as a hole rather than as a zero', () => {
    const series = chartSeries(
      result(dayAndRevenue, [
        ['Mon', 12],
        ['Tue', null],
      ]),
      axes,
    )

    // Zero would draw a bar at the baseline and read as "we sold nothing",
    // which is a different claim from "we do not know".
    expect(series.points[1]).toEqual({ label: 'Tue', value: null })
  })

  it('narrows a BIGINT to a height', () => {
    const columns = [column('day', 'VARCHAR', 'string'), column('orders', 'BIGINT', 'bigint')]

    expect(chartSeries(result(columns, [['Mon', 42n]]), axes).points[0]?.value).toBe(42)
  })

  it('refuses a value with no height: NaN, Infinity, or text', () => {
    const series = chartSeries(
      result(dayAndRevenue, [
        ['a', Number.NaN],
        ['b', Number.POSITIVE_INFINITY],
        ['c', 'eleven'],
      ]),
      axes,
    )

    expect(series.points.map((point) => point.value)).toEqual([null, null, null])
  })

  it('counts every row, and draws at most MAX_POINTS of them', () => {
    const rows: Row[] = Array.from({ length: MAX_POINTS + 40 }, (_, index) => [`r${index}`, index])
    const series = chartSeries(result(dayAndRevenue, rows), axes)

    expect(series.points).toHaveLength(MAX_POINTS)
    expect(series.rowCount).toBe(MAX_POINTS + 40)
    expect(series.isTruncated).toBe(true)
  })

  it('says so when it drew the whole result', () => {
    expect(chartSeries(result(dayAndRevenue, [['Mon', 1]]), axes).isTruncated).toBe(false)
  })

  it('draws nothing when an axis points past the end of the result', () => {
    const series = chartSeries(result(dayAndRevenue, [['Mon', 1]]), {
      x: { index: 0, name: 'day' },
      y: { index: 9, name: 'margin' },
    })

    expect(series.points).toEqual([])
  })

  it('reads a missing cell as absent rather than throwing', () => {
    // noUncheckedIndexedAccess is not paranoia here: a short row is what a
    // ragged CSV produces.
    const series = chartSeries(result(dayAndRevenue, [['Mon']]), axes)

    expect(series.points).toEqual([{ label: 'Mon', value: null }])
  })
})

describe('hasPlottableValue', () => {
  it('finds a single height among the holes', () => {
    expect(hasPlottableValue([{ label: 'a', value: null }, { label: 'b', value: 0 }])).toBe(true)
  })

  it('reads a column of NULL as nothing to draw', () => {
    expect(hasPlottableValue([{ label: 'a', value: null }])).toBe(false)
    expect(hasPlottableValue([])).toBe(false)
  })
})
