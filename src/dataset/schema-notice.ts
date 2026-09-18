/**
 * Something worth saying about a schema that loaded anyway.
 *
 * This is not a failure path. DuckDB is forgiving about CSV, and the shapes it
 * is most forgiving about are the ones a reader most needs telling about: a
 * file whose separator was guessed wrong does not raise anything, it just comes
 * back looking wrong. `ragged.csv` (rows of three, two, then five fields)
 * loads as one row of five numbered columns and no error at all.
 */
import type { Column } from '../duckdb/client'

export type SchemaNotice = {
  headline: string
  detail: string
}

/**
 * DuckDB numbers columns `column0`, `column1`, … when it decides the first line
 * of the file is data rather than a header. That is legitimate for a headerless
 * export and suspicious for anything else, and the reader is the only one who
 * can tell the two apart, so this says what happened and does not guess.
 */
function hasNumberedColumns(columns: readonly Column[]): boolean {
  return columns.length > 0 && columns.every((column, position) => column.name === `column${position}`)
}

export function schemaNotice(columns: readonly Column[]): SchemaNotice | null {
  if (hasNumberedColumns(columns)) {
    return {
      headline: 'No header row.',
      detail:
        'DuckDB read the first line as data and numbered the columns. If the file does have a header, the separator it picked is probably the wrong one.',
    }
  }

  return null
}
