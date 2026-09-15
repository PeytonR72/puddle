import { describe, expect, it } from 'vitest'
import { classifyColumnType, toColumn, toResultValue } from './result'

describe('classifyColumnType', () => {
  it('reads DuckDB type names', () => {
    expect(classifyColumnType('VARCHAR')).toBe('string')
    expect(classifyColumnType('INTEGER')).toBe('number')
    expect(classifyColumnType('DOUBLE')).toBe('number')
    expect(classifyColumnType('DECIMAL(18,3)')).toBe('number')
    expect(classifyColumnType('BIGINT')).toBe('bigint')
    expect(classifyColumnType('HUGEINT')).toBe('bigint')
    expect(classifyColumnType('BOOLEAN')).toBe('boolean')
    expect(classifyColumnType('DATE')).toBe('date')
    expect(classifyColumnType('TIME')).toBe('time')
    expect(classifyColumnType('TIMESTAMP WITH TIME ZONE')).toBe('timestamp')
    expect(classifyColumnType('UUID')).toBe('string')
    expect(classifyColumnType('BLOB')).toBe('other')
    expect(classifyColumnType('INTERVAL')).toBe('other')
  })

  it('reads Arrow type names, which is what a query result reports', () => {
    expect(classifyColumnType('Utf8')).toBe('string')
    expect(classifyColumnType('LargeUtf8')).toBe('string')
    expect(classifyColumnType('Dictionary<Utf8, Int32>')).toBe('string')
    expect(classifyColumnType('Int32')).toBe('number')
    expect(classifyColumnType('Float64')).toBe('number')
    expect(classifyColumnType('Int64')).toBe('bigint')
    expect(classifyColumnType('Uint64')).toBe('bigint')
    expect(classifyColumnType('Bool')).toBe('boolean')
    expect(classifyColumnType('Date32<DAY>')).toBe('date')
    expect(classifyColumnType('Date64<MILLISECOND>')).toBe('timestamp')
    expect(classifyColumnType('Time64<MICROSECOND>')).toBe('time')
    expect(classifyColumnType('Timestamp<MICROSECOND>')).toBe('timestamp')
    expect(classifyColumnType('Binary')).toBe('other')
  })

  it('does not mistake a list for its element type', () => {
    expect(classifyColumnType('INTEGER[]')).toBe('other')
    expect(classifyColumnType('VARCHAR[3]')).toBe('other')
    expect(classifyColumnType('List<Int32>')).toBe('other')
    expect(classifyColumnType('STRUCT(n INTEGER)')).toBe('other')
    expect(classifyColumnType('MAP(VARCHAR, INTEGER)')).toBe('other')
  })

  it('falls back rather than guessing', () => {
    expect(classifyColumnType('')).toBe('other')
    expect(classifyColumnType('   ')).toBe('other')
    expect(classifyColumnType('SOMETHING_NEW')).toBe('other')
  })

  it('ignores case and surrounding space', () => {
    expect(classifyColumnType('  varchar  ')).toBe('string')
    expect(classifyColumnType('bigint')).toBe('bigint')
  })
})

describe('toColumn', () => {
  it('keeps the engine spelling and adds the kind', () => {
    expect(toColumn({ name: 'total', type: { toString: () => 'Int64' } })).toEqual({
      name: 'total',
      type: 'Int64',
      kind: 'bigint',
    })
  })
})

describe('toResultValue', () => {
  it('passes through the values a cell can already hold', () => {
    expect(toResultValue('puddle')).toBe('puddle')
    expect(toResultValue(42)).toBe(42)
    expect(toResultValue(true)).toBe(true)
    expect(toResultValue(9007199254740993n)).toBe(9007199254740993n)
  })

  it('collapses absent values to null', () => {
    expect(toResultValue(null)).toBeNull()
    expect(toResultValue(undefined)).toBeNull()
  })

  it('keeps dates and byte arrays whole', () => {
    const date = new Date('2026-09-15T00:00:00Z')
    expect(toResultValue(date)).toBe(date)
    const bytes = new Uint8Array([1, 2, 3])
    expect(toResultValue(bytes)).toBe(bytes)
  })

  it('converts nested lists', () => {
    expect(toResultValue([1, null, [2n]])).toEqual([1, null, [2n]])
  })

  it('unwraps Arrow rows and vectors, which expose toJSON', () => {
    const structRow = { toJSON: () => ({ city: 'Leeds', visits: 3n }) }
    expect(toResultValue(structRow)).toEqual({ city: 'Leeds', visits: 3n })

    const vector = { toJSON: () => [1, 2, 3] }
    expect(toResultValue(vector)).toEqual([1, 2, 3])
  })

  it('walks plain objects', () => {
    expect(toResultValue({ a: 1, b: { c: undefined } })).toEqual({ a: 1, b: { c: null } })
  })

  it('stops rather than recursing forever on a self-returning toJSON', () => {
    const loop: { toJSON: () => unknown } = { toJSON: () => loop }
    expect(typeof toResultValue(loop)).toBe('string')
  })
})
