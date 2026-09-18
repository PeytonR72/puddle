/**
 * One cell of a result, turned into the string the grid draws.
 *
 * The rules here are the whole of the table's type-awareness, so they live in a
 * module with no React in it. Two of them are worth stating up front, because
 * both are decisions rather than defaults:
 *
 * - **`NULL` is not blank.** An empty cell and an absent value are different
 *   answers, and a reader who cannot tell them apart is reading the data wrong.
 *   So `null` comes back as a token and the grid sets it apart visually; an
 *   empty string stays empty, and the two stop looking alike.
 * - **Nothing is rounded.** A number is shown with the digits DuckDB gave it,
 *   grouped for reading but never shortened. Truncating a value to make a
 *   column fit is the one thing a data tool must not do quietly.
 */
import type { ColumnKind, ResultValue } from '../duckdb/client'

export type CellAlign = 'left' | 'right'

export type Cell = {
  /** What the cell draws. `NULL` when the value is absent. */
  text: string
  /** Absence, not a value. The grid renders it as a token rather than as space. */
  isNull: boolean
}

export const NULL_TEXT = 'NULL'

/**
 * Which edge a column's values line up on.
 *
 * Numbers only. Digits carry their magnitude in their length, so a right edge
 * makes a column of them comparable at a glance; nothing else on this screen
 * gains anything from being pushed away from the reading edge: a right-aligned
 * column of timestamps is just harder to scan.
 */
export function columnAlign(kind: ColumnKind): CellAlign {
  return kind === 'number' || kind === 'bigint' ? 'right' : 'left'
}

export function formatCell(value: ResultValue, kind: ColumnKind): Cell {
  if (value === null) {
    return { text: NULL_TEXT, isNull: true }
  }

  return { text: formatValue(value, kind), isNull: false }
}

/**
 * The value alone cannot always say what it is: a `DATE`, a `TIMESTAMP` and a
 * plain integer all arrive as a `number`, and a `TIME` shares `bigint` with
 * `BIGINT`. So the JS type decides the shape and the column's kind decides the
 * reading, in that order.
 */
function formatValue(value: ResultValue, kind: ColumnKind): string {
  if (value === null) {
    return NULL_TEXT
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (value instanceof Date) {
    return formatEpochMs(value.getTime(), kind)
  }

  if (value instanceof Uint8Array) {
    return formatBinary(value)
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return formatNumeric(value, kind)
  }

  if (Array.isArray(value)) {
    return `[${value.map(formatNested).join(', ')}]`
  }

  const fields = Object.entries(value).map(([key, entry]) => `${key}: ${formatNested(entry)}`)

  return `{${fields.join(', ')}}`
}

/**
 * Inside a list or a struct, a string is quoted.
 *
 * `{name: ada, city: null}` cannot be read back: it hides whether the value was
 * the word "null" or the absence of one. At the top level the cell's own styling
 * answers that, but nested there is nothing to style, so the quotes do it.
 */
function formatNested(value: ResultValue): string {
  if (value === null) {
    return NULL_TEXT
  }

  if (typeof value === 'string') {
    return `"${value}"`
  }

  return formatValue(value, 'other')
}

function formatNumeric(value: number | bigint, kind: ColumnKind): string {
  if (kind === 'date' || kind === 'timestamp') {
    return formatEpochMs(Number(value), kind)
  }

  if (kind === 'time') {
    return formatTimeOfDay(value)
  }

  return groupDigits(String(value))
}

/**
 * Thousands separators, and only where they are safe.
 *
 * A plain decimal gets them. Exponential notation, `NaN`, `Infinity` and
 * anything else `String()` produces is left exactly as it arrived rather than
 * reformatted into something DuckDB did not say.
 */
export function groupDigits(text: string): string {
  const match = /^(-?)(\d+)(\.\d+)?$/.exec(text)

  if (match === null) {
    return text
  }

  const [, sign = '', whole = '', fraction = ''] = match

  return `${sign}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${fraction}`
}

/**
 * Epoch milliseconds, read in UTC.
 *
 * Not the reader's timezone, and this is the important part: DuckDB's `DATE` and
 * `TIMESTAMP` have no zone in them. They are the wall-clock values the file
 * held. Rendering them locally would move every one of them by the reader's
 * offset (a date in the file becoming the day before it on screen), which is
 * the kind of bug people only catch months later.
 */
function formatEpochMs(ms: number, kind: ColumnKind): string {
  if (!Number.isFinite(ms)) {
    return String(ms)
  }

  const moment = new Date(ms)

  if (Number.isNaN(moment.getTime())) {
    return String(ms)
  }

  const day = `${padTo(moment.getUTCFullYear(), 4)}-${padTo(moment.getUTCMonth() + 1, 2)}-${padTo(moment.getUTCDate(), 2)}`

  if (kind === 'date') {
    return day
  }

  const clock = `${padTo(moment.getUTCHours(), 2)}:${padTo(moment.getUTCMinutes(), 2)}:${padTo(moment.getUTCSeconds(), 2)}`
  const millis = moment.getUTCMilliseconds()

  return millis === 0 ? `${day} ${clock}` : `${day} ${clock}.${padTo(millis, 3)}`
}

const MICROS_PER_HOUR = 3_600_000_000n
const MICROS_PER_MINUTE = 60_000_000n
const MICROS_PER_SECOND = 1_000_000n

/**
 * A `TIME` is microseconds since midnight, not a moment: there is no date in
 * it to make a `Date` out of, so the arithmetic is done in `bigint` and the
 * value never passes through a float.
 */
function formatTimeOfDay(value: number | bigint): string {
  const micros = typeof value === 'bigint' ? value : safeBigInt(value)

  if (micros === null || micros < 0n) {
    return groupDigits(String(value))
  }

  const clock = [
    padTo(micros / MICROS_PER_HOUR, 2),
    padTo((micros / MICROS_PER_MINUTE) % 60n, 2),
    padTo((micros / MICROS_PER_SECOND) % 60n, 2),
  ].join(':')

  const fraction = micros % MICROS_PER_SECOND

  if (fraction === 0n) {
    return clock
  }

  // Trailing zeros are noise: `.5` is the same half-second as `.500000`.
  return `${clock}.${padTo(fraction, 6).replace(/0+$/, '')}`
}

function safeBigInt(value: number): bigint | null {
  return Number.isSafeInteger(value) ? BigInt(value) : null
}

/**
 * Bytes, as hex, with a ceiling.
 *
 * A `BLOB` column can hold a megabyte per row, and a cell that puts all of it
 * into the DOM to then clip it at 200px costs a scroll's worth of frames for
 * nothing. The byte count is appended so the shortening is stated rather than
 * silent.
 */
const MAX_BINARY_BYTES = 32

function formatBinary(bytes: Uint8Array): string {
  const shown = bytes.subarray(0, MAX_BINARY_BYTES)
  const hex = Array.from(shown, (byte) => byte.toString(16).padStart(2, '0')).join('')

  return bytes.length > MAX_BINARY_BYTES ? `${hex}… (${bytes.length} bytes)` : hex
}

function padTo(value: number | bigint, width: number): string {
  return String(value).padStart(width, '0')
}
