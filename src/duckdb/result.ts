/**
 * The shape a query result takes once it has crossed out of the worker, and the
 * narrowing that gets it there.
 *
 * Nothing here imports DuckDB or Arrow. A result arrives as `unknown` and is
 * parsed at this boundary, so every module above it can trust what it holds.
 */

/**
 * How a column's values behave: enough to format a cell and to guess an axis,
 * and deliberately no finer.
 */
export type ColumnKind =
  | 'number'
  | 'bigint'
  | 'boolean'
  | 'date'
  | 'time'
  | 'timestamp'
  | 'string'
  | 'other'

/**
 * A column, described the way the engine describes it plus the kind we derive.
 *
 * `type` is whichever name the engine used: DuckDB's own (`BIGINT`) when the
 * column came from `describeTable`, Arrow's (`Int64`) when it came back on a
 * query result. `kind` is the same vocabulary either way, which is what makes
 * it the field worth branching on.
 */
export type Column = {
  name: string
  type: string
  kind: ColumnKind
}

/**
 * A single cell. Open enough to hold a DuckDB struct, closed enough to format.
 *
 * Verified against DuckDB rather than assumed, because two of these surprise:
 * a `DATE` or `TIMESTAMP` arrives as a `number` of epoch milliseconds, and a
 * `TIME` as a `bigint` of microseconds since midnight. Neither arrives as a
 * `Date`. That is what `Column.kind` is for: the value alone cannot tell you.
 */
export type ResultValue =
  | string
  | number
  | bigint
  | boolean
  | Date
  | Uint8Array
  | null
  | ResultValue[]
  | { [key: string]: ResultValue }

/**
 * One row, positional: `row[i]` holds the value for `columns[i]`.
 *
 * Positional rather than keyed by name because SQL does not promise unique
 * names. `SELECT 1 AS a, 2 AS a` really does come back as two columns called
 * `a`, and a row keyed by name drops the first of them without saying so.
 */
export type Row = ResultValue[]

export type Result = {
  columns: Column[]
  rows: Row[]
  rowCount: number
  durationMs: number
}

/** Structural stand-in for an Arrow `Field`, so this module needs no Arrow import. */
export type ColumnMetadata = {
  name: string
  type: { toString: () => string }
}

const KIND_BY_TYPE_NAME: Record<string, ColumnKind> = {
  // Text, and the types DuckDB hands back as text.
  utf8: 'string',
  largeutf8: 'string',
  dictionary: 'string',
  varchar: 'string',
  string: 'string',
  text: 'string',
  char: 'string',
  bpchar: 'string',
  uuid: 'string',
  json: 'string',
  enum: 'string',

  // Numbers that survive a round trip through a JS number.
  int8: 'number',
  int16: 'number',
  int32: 'number',
  uint8: 'number',
  uint16: 'number',
  uint32: 'number',
  int: 'number',
  integer: 'number',
  tinyint: 'number',
  smallint: 'number',
  utinyint: 'number',
  usmallint: 'number',
  uinteger: 'number',
  float: 'number',
  float16: 'number',
  float32: 'number',
  float64: 'number',
  double: 'number',
  real: 'number',
  decimal: 'number',
  numeric: 'number',

  // Numbers that do not, and arrive as bigint instead.
  int64: 'bigint',
  uint64: 'bigint',
  bigint: 'bigint',
  ubigint: 'bigint',
  hugeint: 'bigint',
  uhugeint: 'bigint',

  bool: 'boolean',
  boolean: 'boolean',

  date: 'date',
  date32: 'date',

  date64: 'timestamp',
  datetime: 'timestamp',
  timestamp: 'timestamp',
  timestamptz: 'timestamp',
  timestamp_s: 'timestamp',
  timestamp_ms: 'timestamp',
  timestamp_ns: 'timestamp',

  time: 'time',
  time32: 'time',
  time64: 'time',
  timetz: 'time',
}

/**
 * Classify a type name from either engine.
 *
 * Anything unrecognised is `other` rather than a guess: a column we cannot
 * place should render as text, not as a number that happens to parse.
 */
export function classifyColumnType(typeName: string): ColumnKind {
  const trimmed = typeName.trim()

  // `INTEGER[]` and `List<Int32>` both lead with an element type. Rule lists out
  // before tokenising, or a list of integers classifies as a number.
  if (trimmed.endsWith(']')) {
    return 'other'
  }

  const token = trimmed.toLowerCase().split(/[<(\s]/, 1)[0] ?? ''

  return KIND_BY_TYPE_NAME[token] ?? 'other'
}

export function toColumn(field: ColumnMetadata): Column {
  const type = field.type.toString()

  return { name: field.name, type, kind: classifyColumnType(type) }
}

/**
 * Arrow hands back live objects (vectors, struct row proxies) that are valid
 * only while the table is. Unwrapping them here means a result can outlive the
 * table it came from, and that no component ever holds an Arrow type.
 */
const MAX_DEPTH = 8

type JsonLike = { toJSON: () => unknown }

function hasToJson(value: object): value is JsonLike {
  return 'toJSON' in value && typeof value.toJSON === 'function'
}

export function toResultValue(value: unknown): ResultValue {
  return narrow(value, 0)
}

function narrow(value: unknown, depth: number): ResultValue {
  if (value === null || value === undefined) {
    return null
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return value
  }

  if (typeof value !== 'object') {
    return String(value)
  }

  // Both are already final, and Date has a toJSON that would flatten it.
  if (value instanceof Date || value instanceof Uint8Array) {
    return value
  }

  if (depth >= MAX_DEPTH) {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value.map((entry: unknown) => narrow(entry, depth + 1))
  }

  if (hasToJson(value)) {
    return narrow(value.toJSON(), depth + 1)
  }

  // Annotating the target is what keeps `Object.entries`' `any` from escaping.
  const entries: [string, unknown][] = Object.entries(value)
  const record: Record<string, ResultValue> = {}

  for (const [key, entry] of entries) {
    record[key] = narrow(entry, depth + 1)
  }

  return record
}
