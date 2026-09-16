import { describe, expect, it } from 'vitest'

import { demoFetchFailure } from './demo-dataset'

describe('demoFetchFailure', () => {
  it('names the demo dataset rather than borrowing an ordinary ingest headline', () => {
    const failure = demoFetchFailure('404 Not Found')

    expect(failure.headline).toBe('The demo dataset did not load.')
    expect(failure.detail).toContain('drop a CSV, TSV, or Parquet file')
  })

  it('keeps the underlying message for the disclosure', () => {
    expect(demoFetchFailure('404 Not Found').engineMessage).toBe('404 Not Found')
  })
})
