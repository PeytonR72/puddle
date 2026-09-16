/**
 * Finding, in a block of SQL, the identifiers that name a column of the loaded
 * dataset.
 *
 * This is what lets the editor mark a real column differently from any other
 * word in the query. It is deliberately a scanner over the text rather than a
 * walk of CodeMirror's syntax tree: the thing that has to be got right is
 * *where a name does not count* — inside a string, inside a comment — and that
 * is a handful of rules this module can state, test, and own on its own.
 *
 * It scans the whole document rather than the visible lines. A Puddle query is
 * a screen or two of SQL (one editor, per the v1 scope table), so the saving
 * from windowing would be invisible and the cost — a block comment that opens
 * above the viewport and changes what the visible lines mean — would not be.
 */

/** A half-open range into the SQL, in the same units CodeMirror uses. */
export type ColumnReferenceRange = {
  from: number
  to: number
}

/**
 * DuckDB matches identifiers case-insensitively, quoted ones included — unlike
 * Postgres, where `"Total"` and `total` are two different columns. Lower-casing
 * both sides here is what makes `select TOTAL from data` mark the column a file
 * spells `Total`.
 */
export function columnNameKeys(names: readonly string[]): ReadonlySet<string> {
  return new Set(names.map((name) => name.toLowerCase()))
}

const IDENTIFIER_START = /[A-Za-z_]/
const IDENTIFIER_PART = /[A-Za-z0-9_]/
const DIGIT = /[0-9]/
/** Digits, letters and dots all at once: `1e5`, `1.5`, `0x1f` are one token. */
const NUMBER_PART = /[A-Za-z0-9_.]/

export function findColumnReferences(
  sql: string,
  columnNames: ReadonlySet<string>,
): ColumnReferenceRange[] {
  const found: ColumnReferenceRange[] = []

  if (columnNames.size === 0) {
    return found
  }

  let at = 0

  while (at < sql.length) {
    const char = sql[at] ?? ''

    if (char === '-' && sql[at + 1] === '-') {
      at = skipLineComment(sql, at)
      continue
    }

    if (char === '/' && sql[at + 1] === '*') {
      at = skipBlockComment(sql, at)
      continue
    }

    if (char === "'") {
      at = skipQuoted(sql, at, "'")
      continue
    }

    // `$$text$$`. DuckDB's dollar-quoted strings, which can hold anything at
    // all — including something that looks exactly like a column name.
    if (char === '$' && sql[at + 1] === '$') {
      at = skipDollarQuoted(sql, at)
      continue
    }

    if (char === '"') {
      const end = skipQuoted(sql, at, '"')
      const name = sql.slice(at + 1, Math.max(end - 1, at + 1)).replaceAll('""', '"')

      if (columnNames.has(name.toLowerCase())) {
        found.push({ from: at, to: end })
      }

      at = end
      continue
    }

    if (DIGIT.test(char)) {
      at = skipWhile(sql, at, NUMBER_PART)
      continue
    }

    if (IDENTIFIER_START.test(char)) {
      const end = skipWhile(sql, at, IDENTIFIER_PART)

      if (columnNames.has(sql.slice(at, end).toLowerCase())) {
        found.push({ from: at, to: end })
      }

      at = end
      continue
    }

    at += 1
  }

  return found
}

function skipWhile(sql: string, at: number, pattern: RegExp): number {
  let end = at

  while (end < sql.length && pattern.test(sql[end] ?? '')) {
    end += 1
  }

  return end
}

/** An unterminated comment runs to the end of the document, as DuckDB reads it. */
function skipLineComment(sql: string, at: number): number {
  const newline = sql.indexOf('\n', at)

  return newline < 0 ? sql.length : newline
}

function skipBlockComment(sql: string, at: number): number {
  const close = sql.indexOf('*/', at + 2)

  return close < 0 ? sql.length : close + 2
}

function skipDollarQuoted(sql: string, at: number): number {
  const close = sql.indexOf('$$', at + 2)

  return close < 0 ? sql.length : close + 2
}

/**
 * Past the closing quote. The quote character doubled is an escaped quote and
 * not the end — `'it''s'` is one string, `"say ""hi"""` is one identifier.
 */
function skipQuoted(sql: string, at: number, quote: string): number {
  let end = at + 1

  while (end < sql.length) {
    if (sql[end] === quote) {
      if (sql[end + 1] === quote) {
        end += 2
        continue
      }

      return end + 1
    }

    end += 1
  }

  return sql.length
}
