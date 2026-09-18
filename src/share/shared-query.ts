/**
 * What a share link carries: a query, the shape it was written against, and the
 * name of the file it came from (locked decision 4).
 *
 * **Never the data.** The payload is a description of a dataset, not a copy of
 * one, which is what makes a link safe to paste into a chat window belonging to
 * somebody who should not see the rows.
 *
 * The schema is narrower than the engine's `Column`: a name and the type name to
 * show beside it, and not the derived `kind`. `kind` is recoverable from the
 * type and a link is a URL, so every field costs length that a reader eventually
 * pays for in a chat window.
 */
import type { Column } from '../duckdb/client'

export type SharedColumn = {
  name: string
  /** DuckDB's own spelling (`BIGINT`, `VARCHAR`) as the schema panel shows it. */
  type: string
}

export type SharedQuery = {
  query: string
  schema: SharedColumn[]
  fileName: string
}

export type SharedQueryInput = {
  query: string
  fileName: string
  columns: readonly Column[]
}

/** The payload for the dataset and query currently on screen. */
export function sharedQueryFor({ query, fileName, columns }: SharedQueryInput): SharedQuery {
  return {
    query,
    schema: columns.map((column) => ({ name: column.name, type: column.type })),
    fileName,
  }
}

/**
 * A share link parsed back into a payload, or `null` when it is not one.
 *
 * Everything here arrives from a URL somebody else wrote, so it comes in as
 * `unknown` and leaves as a `SharedQuery` or as nothing. There is no repair
 * step: a payload missing half its fields is a link that was truncated in a
 * chat window, and guessing at what it meant would put a half-query on screen
 * and call it somebody's.
 */
export function parseSharedQuery(value: unknown): SharedQuery | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  if (!('query' in value) || typeof value.query !== 'string' || value.query.trim() === '') {
    return null
  }

  if (!('fileName' in value) || typeof value.fileName !== 'string') {
    return null
  }

  if (!('schema' in value) || !Array.isArray(value.schema)) {
    return null
  }

  // `Array.isArray` narrows to `any[]`, and `any` does not ship. Widening the
  // elements back to `unknown` is what makes the parse below a real check
  // rather than a formality.
  const entries: readonly unknown[] = value.schema
  const schema: SharedColumn[] = []

  for (const entry of entries) {
    const column = parseSharedColumn(entry)

    if (column === null) {
      return null
    }

    schema.push(column)
  }

  return { query: value.query, schema, fileName: value.fileName }
}

function parseSharedColumn(value: unknown): SharedColumn | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  if (!('name' in value) || typeof value.name !== 'string') {
    return null
  }

  if (!('type' in value) || typeof value.type !== 'string') {
    return null
  }

  return { name: value.name, type: value.type }
}
