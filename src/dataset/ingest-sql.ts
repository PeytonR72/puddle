/**
 * The statement that turns a registered file into something SQL can select from.
 *
 * The view is always called `data`, whatever the file is called, so that a query
 * written against one dataset is portable to another, which is what makes a
 * share link (locked decision 4) worth anything.
 */
import type { FileKind } from './file-kind'

/** The name every dataset is exposed under. Queries and share links depend on it. */
export const DATASET_VIEW = 'data'

/**
 * A file name reaching SQL is a string literal, not an identifier, so it takes
 * single-quote doubling rather than `client.ts`'s `quoteIdentifier`. Names with
 * a quote in them are real (`we'ird".csv` registers fine) and unescaped they
 * would end the literal early.
 */
export function quoteStringLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

/**
 * How each format is read.
 *
 * CSV and TSV both go through `read_csv_auto`, which sniffs the dialect and the
 * column types. TSV passes the tab explicitly rather than trusting the sniffer:
 * the sniffer does get a clean TSV right, but a tab-separated file with commas
 * inside its values is exactly the case where it would pick the wrong one, and
 * the extension already told us the answer.
 */
function readerFor(kind: FileKind, fileName: string): string {
  const path = quoteStringLiteral(fileName)

  switch (kind) {
    case 'csv':
      return `read_csv_auto(${path})`
    case 'tsv':
      return `read_csv_auto(${path}, delim='\t')`
    case 'parquet':
      return `read_parquet(${path})`
  }
}

/**
 * `CREATE OR REPLACE`, because the scope table allows one file per session: a
 * second drop replaces the first rather than erroring on a name that is taken.
 */
export function createViewSql(kind: FileKind, fileName: string): string {
  return `CREATE OR REPLACE VIEW ${DATASET_VIEW} AS SELECT * FROM ${readerFor(kind, fileName)}`
}

/** How many rows the view has. Cheap on Parquet, a full scan on CSV. */
export function countRowsSql(): string {
  return `SELECT count(*) AS row_count FROM ${DATASET_VIEW}`
}
