/**
 * Whether the file just loaded is the shape the link was written against, and
 * what to say when it is not.
 *
 * The answer is never a refusal. A share link carries the *dataset's* schema,
 * not the columns the query happens to name, so a file missing three of them
 * may run the query perfectly well, and the person holding the link is the one
 * who knows whether their export is the same data under different headings.
 * So this reports the difference and gets out of the way.
 *
 * Names are compared case-insensitively because that is how DuckDB resolves
 * them: a file whose header says `Amount` answers a query that says `amount`,
 * and calling that column missing would be wrong in the one way a reader cannot
 * check.
 */
import type { Column } from '../duckdb/client'
import { pluralize } from '../dataset/format'
import type { SharedColumn } from './shared-query'

export type SchemaMatch =
  | { status: 'matched' }
  /** Every expected column the loaded file does not have, in the link's order. */
  | { status: 'incomplete'; missing: string[] }

export function matchSchema(
  expected: readonly SharedColumn[],
  loaded: readonly Column[],
): SchemaMatch {
  const present = new Set(loaded.map((column) => column.name.toLowerCase()))
  const missing = expected
    .map((column) => column.name)
    .filter((name) => !present.has(name.toLowerCase()))

  return missing.length === 0 ? { status: 'matched' } : { status: 'incomplete', missing }
}

export type MatchNotice = {
  headline: string
  detail: string
}

/**
 * How many missing names the detail spells out before it starts counting.
 *
 * A file that has nothing in common with the link (the wrong export entirely)
 * makes every column missing, and a paragraph of forty names is not a sentence
 * anybody reads. The first few are enough to recognise the mistake.
 */
const NAMES_SHOWN = 6

/** `null` when the file has every column the link expects. */
export function matchNotice(match: SchemaMatch, fileName: string): MatchNotice | null {
  if (match.status === 'matched') {
    return null
  }

  return {
    headline: `${fileName} is missing ${pluralize(match.missing.length, 'column', 'columns')} this link expects.`,
    detail: `${listNames(match.missing)}. The query may still run: DuckDB will say so if it needs one of them.`,
  }
}

function listNames(names: readonly string[]): string {
  const shown = names.slice(0, NAMES_SHOWN).join(', ')
  const rest = names.length - NAMES_SHOWN

  return rest > 0 ? `Missing: ${shown}, and ${rest} more` : `Missing: ${shown}`
}
