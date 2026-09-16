import { describe, expect, it } from 'vitest'

import type { Column, Row } from '../duckdb/client'
import {
  fitsColumn,
  MAX_COLUMN_WIDTH,
  measureColumnWidth,
  MIN_COLUMN_WIDTH,
  resultColumnWidths,
  WIDTH_SAMPLE_ROWS,
} from './column-width'

const column = (name: string, type: string, kind: Column['kind']): Column => ({ name, type, kind })

describe('measureColumnWidth', () => {
  it('never draws a column narrower than a header can be read in', () => {
    expect(measureColumnWidth({ name: 'id', type: 'INTEGER', values: ['1', '2'] })).toBe(
      MIN_COLUMN_WIDTH,
    )
  })

  it('grows to the widest value it was shown', () => {
    const narrow = measureColumnWidth({ name: 'city', type: 'VARCHAR', values: ['Oslo'] })
    const wide = measureColumnWidth({
      name: 'city',
      type: 'VARCHAR',
      values: ['Oslo', 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch'],
    })

    expect(wide).toBeGreaterThan(narrow)
  })

  it('stops at the ceiling rather than pushing other columns off the screen', () => {
    const width = measureColumnWidth({
      name: 'body',
      type: 'VARCHAR',
      values: ['x'.repeat(4_000)],
    })

    expect(width).toBe(MAX_COLUMN_WIDTH)
  })

  it('lets a long column name set the width on its own', () => {
    const width = measureColumnWidth({
      name: 'gross_merchandise_value_usd',
      type: 'DOUBLE',
      values: ['1'],
    })

    expect(width).toBeGreaterThan(MIN_COLUMN_WIDTH)
  })
})

describe('fitsColumn', () => {
  it('answers whether a cell will be clipped by its column', () => {
    expect(fitsColumn('Oslo', MIN_COLUMN_WIDTH)).toBe(true)
    expect(fitsColumn('x'.repeat(200), MAX_COLUMN_WIDTH)).toBe(false)
  })
})

describe('resultColumnWidths', () => {
  it('returns one width per column, in column order', () => {
    const columns = [column('id', 'INTEGER', 'number'), column('note', 'VARCHAR', 'string')]
    const rows: Row[] = [[1, 'a note long enough to matter, comfortably past the minimum width']]

    const widths = resultColumnWidths(columns, rows)

    expect(widths).toHaveLength(2)
    expect(widths[0]).toBe(MIN_COLUMN_WIDTH)
    expect(widths[1]).toBeGreaterThan(MIN_COLUMN_WIDTH)
  })

  it('measures the formatted value, not the raw one', () => {
    const columns = [column('at', 'TIMESTAMP', 'timestamp')]
    const rows: Row[] = [[Date.UTC(2026, 8, 15, 23, 30, 5)]]

    // The raw value is 17 digits; what the cell draws is 19 characters. Sizing
    // on the number would clip the seconds off every row.
    const [width = 0] = resultColumnWidths(columns, rows)
    expect(fitsColumn('2026-09-15 23:30:05', width)).toBe(true)
  })

  it('samples the head of the result rather than reading 100k rows', () => {
    const columns = [column('note', 'VARCHAR', 'string')]
    const rows: Row[] = Array.from({ length: WIDTH_SAMPLE_ROWS + 50 }, (_row, index) =>
      index < WIDTH_SAMPLE_ROWS ? ['short'] : ['x'.repeat(300)],
    )

    expect(resultColumnWidths(columns, rows)).toEqual([MIN_COLUMN_WIDTH])
  })

  it('treats a missing cell as NULL rather than measuring undefined', () => {
    const columns = [column('id', 'INTEGER', 'number'), column('missing', 'VARCHAR', 'string')]

    expect(resultColumnWidths(columns, [[1]])).toEqual([MIN_COLUMN_WIDTH, MIN_COLUMN_WIDTH])
  })
})
