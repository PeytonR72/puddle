import { describe, expect, it } from 'vitest'

import type { Result } from '../duckdb/client'
import type { QueryRun } from '../query/run-state'
import { resultsNotice } from './results-notice'

const emptyResult: Result = { columns: [], rows: [], rowCount: 0, durationMs: 4 }

const oneRow: Result = {
  columns: [{ name: 'n', type: 'INTEGER', kind: 'number' }],
  rows: [[1]],
  rowCount: 1,
  durationMs: 4,
}

describe('resultsNotice', () => {
  it('invites a first run before anything has been run', () => {
    expect(resultsNotice({ status: 'idle' })?.headline).toBe('No rows yet')
  })

  it('says the engine is working, and nothing else', () => {
    expect(resultsNotice({ status: 'running', startedAt: 0 })).toEqual({
      headline: 'Running',
      detail: null,
    })
  })

  it('stands down for a result that has rows in it', () => {
    expect(resultsNotice({ status: 'succeeded', result: oneRow })).toBe(null)
  })

  it('reads an empty result as a success, not as a failure', () => {
    const notice = resultsNotice({ status: 'succeeded', result: emptyResult })

    expect(notice).toEqual({
      headline: 'Nothing matched',
      detail: 'The query ran without error and returned no rows.',
    })
  })

  it('tells the two empties apart', () => {
    const failed: QueryRun = {
      status: 'failed',
      failure: { headline: 'No such column', engineMessage: 'Binder Error: …' },
    }

    const succeeded: QueryRun = { status: 'succeeded', result: emptyResult }

    // The point of the module: an error and an empty result are both a blank
    // grid, and they must not read as the same outcome.
    expect(resultsNotice(failed)).not.toEqual(resultsNotice(succeeded))
  })

  it('does not repeat the engine message, which is already on screen', () => {
    const notice = resultsNotice({
      status: 'failed',
      failure: { headline: 'No such column', engineMessage: 'Binder Error: …' },
    })

    expect(notice?.detail).not.toContain('Binder Error')
  })
})
