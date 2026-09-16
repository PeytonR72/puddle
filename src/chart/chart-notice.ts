/**
 * What stands in for the chart when there is no chart to draw.
 *
 * The rule here is narrower than the one the results grid follows, because this
 * panel sits directly under that grid: **the chart only explains itself when it
 * knows something the grid above does not.** A failed query and an empty result
 * are already described a few inches up, in more detail than a second copy
 * would add, so those get a headline and nothing else — repeating the
 * explanation makes one outcome look like two.
 *
 * Two cases are the chart's own, and both carry a detail:
 *
 * - **Nothing in the result is a number.** The rows are fine and there is still
 *   no chart, which is the one state a reader cannot work out by looking.
 * - **The chosen column is entirely `NULL`.** A blank plot beside a full grid
 *   otherwise reads as a bug.
 */
import type { QueryRun } from '../query/run-state'
import { isPlottable } from './chart-axes'

export type ChartNotice = {
  headline: string
  /** The human half. `null` where the grid above has already said it. */
  detail: string | null
}

/** `null` means there is something to plot: draw the chart instead. */
export function chartNotice(run: QueryRun): ChartNotice | null {
  if (run.status === 'idle') {
    return { headline: 'No chart yet', detail: null }
  }

  if (run.status === 'running') {
    return { headline: 'Running', detail: null }
  }

  if (run.status === 'failed') {
    return { headline: 'No chart', detail: null }
  }

  if (run.result.rows.length === 0) {
    return { headline: 'No chart', detail: null }
  }

  if (!run.result.columns.some((column) => isPlottable(column.kind))) {
    return {
      headline: 'No number to plot',
      detail: 'A chart needs a numeric column, and this result has none. Select a number, or count the rows.',
    }
  }

  return null
}

/**
 * The chart's one runtime refusal: a column that is all absence.
 *
 * Kept apart from `chartNotice` because it depends on the column the reader
 * chose rather than on the run, and it names that column — a reader looking at
 * an empty plot needs to know which of the two selects to move.
 */
export function nullColumnNotice(columnName: string): ChartNotice {
  return {
    headline: 'Every value is NULL',
    detail: `There is nothing to draw in ${columnName}. Pick another column, or filter the NULLs out.`,
  }
}
