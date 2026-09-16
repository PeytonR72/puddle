import { describe, expect, it } from 'vitest'

import type { Column } from '../duckdb/client'
import { parseSharedQuery, sharedQueryFor } from './shared-query'

const column = (name: string, type = 'VARCHAR'): Column => ({ name, type, kind: 'string' })

describe('sharedQueryFor', () => {
  it('carries the query, the file name, and the columns by name and type', () => {
    const shared = sharedQueryFor({
      query: 'SELECT * FROM data',
      fileName: 'orders.csv',
      columns: [column('region'), column('amount', 'DOUBLE')],
    })

    expect(shared).toEqual({
      query: 'SELECT * FROM data',
      fileName: 'orders.csv',
      schema: [
        { name: 'region', type: 'VARCHAR' },
        { name: 'amount', type: 'DOUBLE' },
      ],
    })
  })

  it('drops the derived kind, which a type name already implies', () => {
    const [first] = sharedQueryFor({
      query: 'SELECT 1',
      fileName: 'orders.csv',
      columns: [column('region')],
    }).schema

    expect(first).not.toHaveProperty('kind')
  })
})

describe('parseSharedQuery', () => {
  const payload = {
    query: 'SELECT * FROM data',
    schema: [{ name: 'region', type: 'VARCHAR' }],
    fileName: 'orders.csv',
  }

  it('accepts a payload with all three fields', () => {
    expect(parseSharedQuery(payload)).toEqual(payload)
  })

  it('accepts an empty schema, which is a file DuckDB found no columns in', () => {
    expect(parseSharedQuery({ ...payload, schema: [] })?.schema).toEqual([])
  })

  it('refuses anything that is not an object', () => {
    expect(parseSharedQuery(null)).toBeNull()
    expect(parseSharedQuery('SELECT 1')).toBeNull()
    expect(parseSharedQuery(42)).toBeNull()
    expect(parseSharedQuery(undefined)).toBeNull()
  })

  it('refuses a payload missing any of the three fields', () => {
    expect(parseSharedQuery({ schema: [], fileName: 'orders.csv' })).toBeNull()
    expect(parseSharedQuery({ query: 'SELECT 1', fileName: 'orders.csv' })).toBeNull()
    expect(parseSharedQuery({ query: 'SELECT 1', schema: [] })).toBeNull()
  })

  it('refuses a query that is empty or only whitespace', () => {
    // A link exists to carry a query. One that carries none is a truncated
    // link, not a session worth opening read-only.
    expect(parseSharedQuery({ ...payload, query: '' })).toBeNull()
    expect(parseSharedQuery({ ...payload, query: '  \n ' })).toBeNull()
  })

  it('refuses a schema that is not an array of named, typed columns', () => {
    expect(parseSharedQuery({ ...payload, schema: 'region' })).toBeNull()
    expect(parseSharedQuery({ ...payload, schema: [{ name: 'region' }] })).toBeNull()
    expect(parseSharedQuery({ ...payload, schema: [{ type: 'VARCHAR' }] })).toBeNull()
    expect(parseSharedQuery({ ...payload, schema: [null] })).toBeNull()
    expect(parseSharedQuery({ ...payload, schema: ['region'] })).toBeNull()
  })

  it('refuses the whole payload when one column of many is malformed', () => {
    // Half a schema would put the wrong expected columns on screen, which is
    // worse than showing none.
    const schema = [{ name: 'region', type: 'VARCHAR' }, { name: 'amount' }]

    expect(parseSharedQuery({ ...payload, schema })).toBeNull()
  })

  it('keeps nothing it was not asked for', () => {
    const parsed = parseSharedQuery({ ...payload, rows: [['north', 1]] })

    expect(parsed).not.toHaveProperty('rows')
  })
})
