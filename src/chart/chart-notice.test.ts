import { describe, expect, it } from 'vitest'

import type { Column, Result, Row } from '../duckdb/client'
import type { QueryRun } from '../query/run-state'
import { chartNotice, nullColumnNotice } from './chart-notice'

const column = (name: string, type: string, kind: Column['kind']): Column => ({ name, type, kind })

const succeeded = (columns: Column[], rows: Row[]): QueryRun => {
  const result: Result = { columns, rows, rowCount: rows.length, durationMs: 3 }

  return { status: 'succeeded', result }
}

const chartable = succeeded(
  [column('day', 'VARCHAR', 'string'), column('revenue', 'DOUBLE', 'number')],
  [['Mon', 12]],
)

describe('chartNotice', () => {
  it('stands down for a result it can draw', () => {
    expect(chartNotice(chartable)).toBe(null)
  })

  it('says the engine is working, and nothing else', () => {
    expect(chartNotice({ status: 'running', startedAt: 0 })).toEqual({
      headline: 'Running',
      detail: null,
    })
  })

  it('waits quietly before the first run', () => {
    expect(chartNotice({ status: 'idle' })).toEqual({ headline: 'No chart yet', detail: null })
  })

  it('leaves a failure to the panel that already explained it', () => {
    const failed: QueryRun = {
      status: 'failed',
      failure: { headline: 'No such column', engineMessage: 'Binder Error: …' },
    }

    // The error is on screen above, in DuckDB's own words. A second account of
    // it here would read as a second thing having gone wrong.
    expect(chartNotice(failed)).toEqual({ headline: 'No chart', detail: null })
  })

  it('leaves an empty result to the grid above too', () => {
    const empty = succeeded([column('revenue', 'DOUBLE', 'number')], [])

    expect(chartNotice(empty)).toEqual({ headline: 'No chart', detail: null })
  })

  it('explains the one state the grid above cannot show', () => {
    const noNumbers = succeeded(
      [column('day', 'DATE', 'date'), column('region', 'VARCHAR', 'string')],
      [[1_789_516_800_000, 'North']],
    )

    const notice = chartNotice(noNumbers)

    expect(notice?.headline).toBe('No number to plot')
    expect(notice?.detail).not.toBe(null)
  })

  it('does not mistake a date for a number, though both arrive as one', () => {
    const dates = succeeded([column('day', 'DATE', 'date')], [[1_789_516_800_000]])

    expect(chartNotice(dates)?.headline).toBe('No number to plot')
  })

  it('draws a result whose only column is a number', () => {
    expect(chartNotice(succeeded([column('n', 'BIGINT', 'bigint')], [[1n]]))).toBe(null)
  })
})

describe('nullColumnNotice', () => {
  it('names the column the reader has to move off', () => {
    expect(nullColumnNotice('margin').detail).toContain('margin')
  })
})
