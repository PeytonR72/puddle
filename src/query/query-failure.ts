/**
 * Turning a failed query into something worth reading.
 *
 * This is the opposite call from `dataset/ingest-failure.ts`, on purpose. A
 * failed *load* gets DuckDB's words tucked behind a disclosure, because the
 * sniffer answers a bad CSV with twenty lines about candidate delimiters and
 * SQL the reader never wrote. A failed *query* is the reverse: the reader wrote
 * the SQL, and DuckDB's answer (`Referenced column "amont" not found in FROM
 * clause! Candidate bindings: "amount"`) is the most useful sentence on the
 * screen. So it is shown, verbatim, and the headline above it only says which
 * kind of wrong this is.
 */
import { QueryError } from '../duckdb/client'

export type QueryFailure = {
  /** One line: which kind of wrong this is. */
  headline: string
  /** DuckDB's own text, shown rather than hidden. */
  engineMessage: string
}

/**
 * DuckDB names the class of every error it raises, in a prefix it puts on the
 * message itself. Reading it lets the headline say something true about this
 * failure rather than "the query failed" over and over.
 */
const HEADLINE_BY_ERROR_CLASS: Record<string, string> = {
  parser: 'That is not valid SQL.',
  syntax: 'That is not valid SQL.',
  binder: 'The query names a column that is not in the data.',
  catalog: 'The query names a table or function DuckDB does not have.',
  conversion: 'A value would not convert to the type the query asked for.',
  'out of memory': 'The query ran out of memory in this tab.',
  'invalid input': 'DuckDB refused one of the values in the query.',
  io: 'DuckDB could not read the file behind the view.',
  'not implemented': 'This build of DuckDB does not have that feature.',
  internal: 'DuckDB hit an internal error.',
}

const ERROR_CLASS = /^([A-Za-z ]+) Error:/

function headlineFor(engineMessage: string): string {
  const named = ERROR_CLASS.exec(engineMessage)?.[1]?.toLowerCase()

  return (named === undefined ? undefined : HEADLINE_BY_ERROR_CLASS[named]) ?? 'DuckDB refused the query.'
}

export function classifyQueryFailure(cause: unknown): QueryFailure {
  if (cause instanceof QueryError) {
    return { headline: headlineFor(cause.message), engineMessage: cause.message }
  }

  // Anything that is not a QueryError never reached the parser: the engine was
  // not running, or the worker died under it. That is not the reader's SQL
  // being wrong, and saying so would send them to fix the wrong thing.
  return {
    headline: 'The query never reached DuckDB.',
    engineMessage: cause instanceof Error ? cause.message : String(cause),
  }
}
