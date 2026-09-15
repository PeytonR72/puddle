/**
 * The query the editor opens with once a file is loaded.
 *
 * `SELECT *` with a `LIMIT` rather than an empty editor: a stranger who has just
 * dropped a file wants to see the rows, and a blank editor asks them to guess
 * the view's name before they can. The limit is there because the first run
 * happens before anyone knows how big the file is.
 */
import { DATASET_VIEW } from '../dataset/ingest-sql'

export const DEFAULT_QUERY = `SELECT * FROM ${DATASET_VIEW} LIMIT 100`

/**
 * What the editor should hold when a dataset arrives.
 *
 * Typed SQL survives a replacement file. The columns may well be wrong for the
 * new dataset and DuckDB will say so on the next run — that is a better outcome
 * than silently deleting something a person wrote. Whitespace counts as empty,
 * so a draft that was cleared back to blank still gets seeded.
 */
export function seedQuery(current: string): string {
  return current.trim() === '' ? DEFAULT_QUERY : current
}
