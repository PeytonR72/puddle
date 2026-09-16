/**
 * A result column's type, in the vocabulary the reader is writing SQL in.
 *
 * `Column.type` is whichever name the engine used (`src/duckdb/result.ts`), and
 * for a query result that is Arrow's: `Int64`, `Utf8`, `Timestamp<MICROSECOND>`.
 * The schema panel a few hundred pixels to the left shows DuckDB's own names for
 * the same columns — `BIGINT`, `VARCHAR`, `TIMESTAMP` — because that is what
 * `describeTable` returns.
 *
 * Both are true and they cannot both be on screen. A type name here is content
 * rather than chrome (`docs/design/tokens.md`), and its job is to tell a reader
 * what they may write in the next query, so the header speaks SQL and Arrow's
 * spelling is translated on the way out.
 *
 * A name with no translation is passed through exactly as it arrived. Guessing
 * at a type would be worse than showing an unfamiliar one.
 */

const SQL_NAME_BY_ARROW_NAME: Record<string, string> = {
  int8: 'TINYINT',
  int16: 'SMALLINT',
  int32: 'INTEGER',
  int64: 'BIGINT',
  uint8: 'UTINYINT',
  uint16: 'USMALLINT',
  uint32: 'UINTEGER',
  uint64: 'UBIGINT',

  float16: 'FLOAT',
  float32: 'FLOAT',
  float64: 'DOUBLE',

  utf8: 'VARCHAR',
  largeutf8: 'VARCHAR',
  // DuckDB dictionary-encodes text and nothing else, which is the same call
  // `classifyColumnType` makes when it reads this as a string.
  dictionary: 'VARCHAR',

  binary: 'BLOB',
  largebinary: 'BLOB',

  bool: 'BOOLEAN',
  null: 'NULL',

  date32: 'DATE',
  // Arrow's 64-bit date carries a time of day, so DuckDB's name for it is not DATE.
  date64: 'TIMESTAMP',
  time32: 'TIME',
  time64: 'TIME',
}

export function sqlTypeName(engineName: string): string {
  const trimmed = engineName.trim()
  const parameters = readParameters(trimmed)
  const token = trimmed.toLowerCase().split(/[<[]/, 1)[0] ?? ''

  if (token === 'timestamp') {
    // `Timestamp<MICROSECOND>` against `Timestamp<MICROSECOND, UTC>`: the second
    // argument is a timezone, and it is the difference between DuckDB's two types.
    return parameters.includes(',') ? 'TIMESTAMPTZ' : 'TIMESTAMP'
  }

  if (token === 'decimal') {
    return formatDecimal(parameters) ?? trimmed
  }

  return SQL_NAME_BY_ARROW_NAME[token] ?? trimmed
}

/** Whatever sits inside the `<>` or `[]` of an Arrow type name. */
function readParameters(name: string): string {
  const opened = name.search(/[<[]/)

  return opened === -1 ? '' : name.slice(opened + 1, -1)
}

/**
 * Arrow writes a decimal's precision and scale as `Decimal[38e+9]`. DuckDB
 * writes the same type as `DECIMAL(38,9)`, and both numbers matter to someone
 * reading a column of money, so they are carried across rather than dropped.
 */
function formatDecimal(parameters: string): string | null {
  const match = /^(\d+)e([+-]?\d+)$/.exec(parameters)

  if (match === null) {
    return null
  }

  const [, precision = '', scale = '0'] = match

  return `DECIMAL(${precision},${Number(scale)})`
}
