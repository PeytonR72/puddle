/**
 * Getting a file from the drop zone to a queryable view, in four steps.
 *
 * This is the only impure module in the feature: everything it decides is
 * decided by the pure modules beside it, and everything it does to DuckDB goes
 * through `src/duckdb/client.ts` (locked decision 5).
 */
import { describeTable, query, registerFile, type Column, type ResultValue } from '../duckdb/client'
import type { FileKind } from './file-kind'
import { countRowsSql, createViewSql, DATASET_VIEW } from './ingest-sql'

/**
 * A loaded file, as the rest of the app sees it. The file itself is not here —
 * DuckDB holds the handle and reads it on demand (locked decision 3), so
 * nothing above this line has a reason to keep the bytes.
 */
export type Dataset = {
  fileName: string
  kind: FileKind
  columns: Column[]
  rowCount: number
}

/**
 * `count(*)` comes back as a DuckDB `BIGINT`, which the client hands over as a
 * `bigint` on purpose — it does not narrow integers that might not survive the
 * trip. A row count is safe to narrow here: a file with more rows than
 * `Number.MAX_SAFE_INTEGER` is not one a browser tab is reading.
 */
function toRowCount(value: ResultValue | undefined): number {
  if (typeof value === 'bigint') {
    return Number(value)
  }

  if (typeof value === 'number') {
    return value
  }

  throw new Error(`Expected a row count from DuckDB, got ${typeof value}.`)
}

/**
 * Register the file, wrap it in the `data` view, then describe and measure it.
 *
 * The view is created before anything is read from it because that is where
 * DuckDB does the work: it binds the view at creation, so a CSV whose dialect
 * cannot be sniffed fails here rather than on the first query. That is what
 * makes it possible to report a bad file at drop time instead of later.
 */
export async function loadDataset(file: File, kind: FileKind): Promise<Dataset> {
  await registerFile(file)
  await query(createViewSql(kind, file.name))

  const columns = await describeTable(DATASET_VIEW)
  const counted = await query(countRowsSql())

  return {
    fileName: file.name,
    kind,
    columns,
    rowCount: toRowCount(counted.rows[0]?.[0]),
  }
}
