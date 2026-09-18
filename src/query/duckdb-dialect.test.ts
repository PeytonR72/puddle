import { describe, expect, it } from 'vitest'

import { DuckDB } from './duckdb-dialect'

/**
 * The dialect's behaviour is the parser's, and parsing is not what is worth
 * asserting here. What is worth asserting is the handful of settings that are
 * DuckDB rather than Postgres: the ones a future edit could quietly undo.
 */
describe('DuckDB dialect', () => {
  it('knows the syntax people come to DuckDB for', () => {
    const keywords = (DuckDB.spec.keywords ?? '').split(' ')

    for (const keyword of ['qualify', 'pivot', 'unpivot', 'exclude', 'asof', 'summarize']) {
      expect(keywords).toContain(keyword)
    }
  })

  it('knows DuckDB type names and their aliases', () => {
    const types = (DuckDB.spec.types ?? '').split(' ')

    for (const type of ['hugeint', 'varchar', 'int8', 'timestamptz', 'struct']) {
      expect(types).toContain(type)
    }
  })

  it('reads double quotes as an identifier, not a string', () => {
    expect(DuckDB.spec.doubleQuotedStrings ?? false).toBe(false)
    expect(DuckDB.spec.identifierQuotes).toBe('"')
  })

  it('leaves # and // alone, because neither starts a comment in DuckDB', () => {
    expect(DuckDB.spec.hashComments).toBe(false)
    expect(DuckDB.spec.slashComments).toBe(false)
  })

  it('treats a backslash in a string as a backslash', () => {
    expect(DuckDB.spec.backslashEscapes).toBe(false)
  })

  it('counts : among the operator characters, for ::', () => {
    expect(DuckDB.spec.operatorChars).toContain(':')
  })
})
