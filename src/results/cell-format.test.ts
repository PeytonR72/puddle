import { describe, expect, it } from 'vitest'

import { columnAlign, formatCell, groupDigits } from './cell-format'

describe('columnAlign', () => {
  it('lines numbers up on their right edge', () => {
    expect(columnAlign('number')).toBe('right')
    expect(columnAlign('bigint')).toBe('right')
  })

  it('leaves everything else on the reading edge', () => {
    expect(columnAlign('string')).toBe('left')
    expect(columnAlign('boolean')).toBe('left')
    expect(columnAlign('date')).toBe('left')
    expect(columnAlign('timestamp')).toBe('left')
    expect(columnAlign('other')).toBe('left')
  })
})

describe('formatCell', () => {
  it('marks an absent value rather than drawing nothing', () => {
    expect(formatCell(null, 'string')).toEqual({ text: 'NULL', isNull: true })
    expect(formatCell(null, 'number')).toEqual({ text: 'NULL', isNull: true })
  })

  it('keeps an empty string empty, so it cannot be mistaken for NULL', () => {
    expect(formatCell('', 'string')).toEqual({ text: '', isNull: false })
  })

  it('groups a number without rounding it', () => {
    expect(formatCell(1428, 'number').text).toBe('1,428')
    expect(formatCell(1234567.891, 'number').text).toBe('1,234,567.891')
    expect(formatCell(-9000, 'number').text).toBe('-9,000')
  })

  it('groups a bigint, which is the whole reason it is a bigint', () => {
    expect(formatCell(9007199254740993n, 'bigint').text).toBe('9,007,199,254,740,993')
  })

  it('leaves a number JavaScript will not write as digits alone', () => {
    expect(formatCell(Number.NaN, 'number').text).toBe('NaN')
    expect(formatCell(Number.POSITIVE_INFINITY, 'number').text).toBe('Infinity')
    expect(formatCell(1e21, 'number').text).toBe('1e+21')
  })

  it('writes booleans as SQL says them', () => {
    expect(formatCell(true, 'boolean').text).toBe('true')
    expect(formatCell(false, 'boolean').text).toBe('false')
  })

  // A DATE arrives as epoch milliseconds, not a Date — see src/duckdb/result.ts.
  it('reads a date as the day it was, in UTC', () => {
    expect(formatCell(Date.UTC(2026, 8, 15), 'date').text).toBe('2026-09-15')
  })

  it('does not shift a timestamp into the reader timezone', () => {
    // 23:30 UTC. Anywhere west of Greenwich, a local reading moves this to the
    // 14th, which is a different answer than the file gave.
    expect(formatCell(Date.UTC(2026, 8, 15, 23, 30, 5), 'timestamp').text).toBe(
      '2026-09-15 23:30:05',
    )
  })

  it('keeps the milliseconds on a timestamp that has any', () => {
    expect(formatCell(Date.UTC(2026, 8, 15, 1, 2, 3, 40), 'timestamp').text).toBe(
      '2026-09-15 01:02:03.040',
    )
  })

  it('accepts a Date object as well as epoch milliseconds', () => {
    expect(formatCell(new Date(Date.UTC(2026, 8, 15)), 'date').text).toBe('2026-09-15')
  })

  // A TIME arrives as a bigint of microseconds since midnight.
  it('reads a time of day out of microseconds', () => {
    expect(formatCell(0n, 'time').text).toBe('00:00:00')
    expect(formatCell(45_296_000_000n, 'time').text).toBe('12:34:56')
  })

  it('trims a fractional second to what it actually says', () => {
    expect(formatCell(45_296_500_000n, 'time').text).toBe('12:34:56.5')
    expect(formatCell(45_296_000_001n, 'time').text).toBe('12:34:56.000001')
  })

  it('writes a list without pretending its strings are bare words', () => {
    expect(formatCell(['ada', 'grace'], 'other').text).toBe('["ada", "grace"]')
    expect(formatCell([1, 2, 3], 'other').text).toBe('[1, 2, 3]')
  })

  it('distinguishes a nested null from the word null', () => {
    expect(formatCell({ city: null, name: 'null' }, 'other').text).toBe(
      '{city: NULL, name: "null"}',
    )
  })

  it('renders binary as hex, and says so when it stops early', () => {
    expect(formatCell(new Uint8Array([0, 15, 255]), 'other').text).toBe('000fff')

    const long = formatCell(new Uint8Array(40), 'other').text
    expect(long).toBe(`${'00'.repeat(32)}… (40 bytes)`)
  })

  it('does not reformat a string that happens to look numeric', () => {
    expect(formatCell('01428', 'string').text).toBe('01428')
  })
})

describe('groupDigits', () => {
  it('only touches plain decimals', () => {
    expect(groupDigits('1234')).toBe('1,234')
    expect(groupDigits('-1234.5')).toBe('-1,234.5')
    expect(groupDigits('1e+21')).toBe('1e+21')
    expect(groupDigits('NaN')).toBe('NaN')
  })
})
