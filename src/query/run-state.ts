/**
 * What a run of the editor's query is doing, and when Run is allowed to work.
 *
 * The state lives here rather than inside the panel so that the one question
 * the interface keeps asking — *may this run, and if not, why not* — has a
 * single answer that can be read in a test.
 */
import type { Result } from '../duckdb/client'
import type { QueryFailure } from './query-failure'

export type QueryRun =
  | { status: 'idle' }
  /** `startedAt` is a `performance.now()` reading, for the elapsed counter. */
  | { status: 'running'; startedAt: number }
  | { status: 'succeeded'; result: Result }
  | { status: 'failed'; failure: QueryFailure }

export type RunConditions = {
  hasDataset: boolean
  isRunning: boolean
  query: string
}

/**
 * Why Run is disabled, or `null` when it is not.
 *
 * A disabled control that does not say why is a dead end, and the first of
 * these is somebody's first minute with Puddle — the editor is on screen and
 * there is nothing to query yet.
 */
export function runBlockedReason({ hasDataset, isRunning, query }: RunConditions): string | null {
  if (!hasDataset) {
    return 'Load a CSV, TSV, or Parquet file first. A query needs something to run against.'
  }

  if (isRunning) {
    return 'The last query is still running.'
  }

  if (query.trim() === '') {
    return 'Write a query first.'
  }

  return null
}
