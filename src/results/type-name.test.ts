import { describe, expect, it } from 'vitest'

import { sqlTypeName } from './type-name'

describe('sqlTypeName', () => {
  it('says what the schema panel says about the same column', () => {
    expect(sqlTypeName('Int64')).toBe('BIGINT')
    expect(sqlTypeName('Utf8')).toBe('VARCHAR')
    expect(sqlTypeName('Float64')).toBe('DOUBLE')
    expect(sqlTypeName('Bool')).toBe('BOOLEAN')
    expect(sqlTypeName('Int32')).toBe('INTEGER')
    expect(sqlTypeName('Uint64')).toBe('UBIGINT')
  })

  it('drops the unit Arrow puts on a temporal type', () => {
    expect(sqlTypeName('Date32<DAY>')).toBe('DATE')
    expect(sqlTypeName('Time64<MICROSECOND>')).toBe('TIME')
    expect(sqlTypeName('Timestamp<MICROSECOND>')).toBe('TIMESTAMP')
  })

  it('keeps the distinction a timezone makes', () => {
    expect(sqlTypeName('Timestamp<MICROSECOND, UTC>')).toBe('TIMESTAMPTZ')
  })

  it('carries the precision and scale of a decimal across', () => {
    expect(sqlTypeName('Decimal[38e+9]')).toBe('DECIMAL(38,9)')
    expect(sqlTypeName('Decimal[18e+0]')).toBe('DECIMAL(18,0)')
  })

  it('leaves the names DuckDB itself uses exactly as they arrived', () => {
    // These come from `describeTable` rather than from a query result, and they
    // are already the vocabulary this function exists to produce.
    expect(sqlTypeName('BIGINT')).toBe('BIGINT')
    expect(sqlTypeName('VARCHAR')).toBe('VARCHAR')
    expect(sqlTypeName('DECIMAL(18,3)')).toBe('DECIMAL(18,3)')
    expect(sqlTypeName('TIMESTAMP')).toBe('TIMESTAMP')
  })

  it('passes a type it cannot translate through untouched', () => {
    expect(sqlTypeName('List<Int32>')).toBe('List<Int32>')
    expect(sqlTypeName('Struct<{a:Int32}>')).toBe('Struct<{a:Int32}>')
    expect(sqlTypeName('Something Nobody Mapped')).toBe('Something Nobody Mapped')
  })
})
