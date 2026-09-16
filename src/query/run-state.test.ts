import { describe, expect, it } from 'vitest'

import { runBlockedReason, type RunConditions } from './run-state'

const READY: RunConditions = {
  hasDataset: true,
  isRunning: false,
  query: 'SELECT * FROM data LIMIT 100',
}

describe('runBlockedReason', () => {
  it('allows a written query against a loaded dataset', () => {
    expect(runBlockedReason(READY)).toBeNull()
  })

  it('explains that there is nothing to query yet', () => {
    expect(runBlockedReason({ ...READY, hasDataset: false })).toBe(
      'Load a CSV, TSV, or Parquet file first. A query needs something to run against.',
    )
  })

  it('explains that the last query has not finished', () => {
    expect(runBlockedReason({ ...READY, isRunning: true })).toBe('The last query is still running.')
  })

  it('explains an empty editor', () => {
    expect(runBlockedReason({ ...READY, query: '' })).toBe('Write a query first.')
    expect(runBlockedReason({ ...READY, query: ' \n ' })).toBe('Write a query first.')
  })

  it('names the missing file before anything else, because it is the fix', () => {
    expect(runBlockedReason({ hasDataset: false, isRunning: true, query: '' })).toBe(
      'Load a CSV, TSV, or Parquet file first. A query needs something to run against.',
    )
  })
})
