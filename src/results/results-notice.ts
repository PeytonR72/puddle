/**
 * What stands in for the grid when there is no grid to draw.
 *
 * Four of the five states of a run put nothing in the table, and they are not
 * the same nothing. The one that matters most is the last: **a query that
 * succeeded and matched no rows has to be legible as a success.** An empty
 * result and a failed query look identical if the screen answers both with a
 * blank area, and a reader who cannot tell them apart will go and rewrite a
 * query that was already correct.
 */
import type { QueryRun } from '../query/run-state'

export type ResultsNotice = {
  headline: string
  /** The human half. `null` where the headline is the whole of it. */
  detail: string | null
}

/** `null` means there are rows: draw the grid instead. */
export function resultsNotice(run: QueryRun): ResultsNotice | null {
  if (run.status === 'idle') {
    return { headline: 'No rows yet', detail: 'Run the query and its rows land here.' }
  }

  if (run.status === 'running') {
    return { headline: 'Running', detail: null }
  }

  if (run.status === 'failed') {
    // Deliberately not the error itself. It is already on screen above the
    // editor, in full, and saying it twice makes the screen look like two
    // things went wrong.
    return { headline: 'No rows', detail: 'The query did not run. DuckDB says why, above.' }
  }

  if (run.result.rows.length === 0) {
    return {
      headline: 'Nothing matched',
      detail: 'The query ran without error and returned no rows.',
    }
  }

  return null
}
