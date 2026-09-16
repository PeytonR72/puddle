/**
 * The bundled dataset behind "Try the demo" — a stranger's way into the app
 * with no file of their own (locked decision 1, second trigger).
 *
 * The file lives under `public/` rather than being fetched from anywhere
 * external, so trying the demo costs the same as loading the page and works
 * offline once the shell is cached.
 */
import type { IngestFailure } from './ingest-failure'

export const DEMO_FILE_NAME = 'coffee-shop-sales.csv'
export const DEMO_FILE_URL = `/demo/${DEMO_FILE_NAME}`

/**
 * The one way loading the demo fails that ordinary ingest never sees: the
 * fetch for Puddle's own bundled file did not come back. `ingest-failure.ts`
 * classifies what DuckDB says about a file it has already read — this never
 * reaches DuckDB, so it gets its own headline instead of a misleading one
 * borrowed from there.
 */
export function demoFetchFailure(engineMessage: string): IngestFailure {
  return {
    headline: 'The demo dataset did not load.',
    detail:
      'Puddle could not fetch its own bundled file. Reload the page and try again, or drop a CSV, TSV, or Parquet file of your own.',
    engineMessage,
  }
}
