import { describe, expect, it } from 'vitest'

import type { Column } from '../duckdb/client'
import { matchNotice, matchSchema } from './schema-match'
import type { SharedColumn } from './shared-query'

const expected = (...names: string[]): SharedColumn[] =>
  names.map((name) => ({ name, type: 'VARCHAR' }))

const loaded = (...names: string[]): Column[] =>
  names.map((name) => ({ name, type: 'VARCHAR', kind: 'string' }))

describe('matchSchema', () => {
  it('matches a file with every expected column', () => {
    expect(matchSchema(expected('region', 'amount'), loaded('region', 'amount'))).toEqual({
      status: 'matched',
    })
  })

  it('matches a file carrying extra columns, which cost the query nothing', () => {
    const match = matchSchema(expected('region'), loaded('region', 'amount', 'ordered_at'))

    expect(match.status).toBe('matched')
  })

  it('ignores order', () => {
    expect(matchSchema(expected('region', 'amount'), loaded('amount', 'region')).status).toBe(
      'matched',
    )
  })

  it('matches on a difference of case, the way DuckDB resolves a name', () => {
    // `SELECT amount` finds a column headed `Amount`, so calling it missing
    // would be wrong in the one way a reader cannot check from the panel.
    expect(matchSchema(expected('amount'), loaded('Amount')).status).toBe('matched')
  })

  it('names what is missing, in the order the link lists it', () => {
    const match = matchSchema(expected('region', 'amount', 'ordered_at'), loaded('amount'))

    expect(match).toEqual({ status: 'incomplete', missing: ['region', 'ordered_at'] })
  })

  it('treats an unrelated file as missing everything', () => {
    const match = matchSchema(expected('region', 'amount'), loaded('lat', 'lon'))

    expect(match).toEqual({ status: 'incomplete', missing: ['region', 'amount'] })
  })

  it('matches an empty expected schema against anything', () => {
    expect(matchSchema([], loaded('region')).status).toBe('matched')
  })
})

describe('matchNotice', () => {
  it('says nothing when the file matches', () => {
    expect(matchNotice({ status: 'matched' }, 'orders.csv')).toBeNull()
  })

  it('names the file and counts what it is missing', () => {
    const notice = matchNotice({ status: 'incomplete', missing: ['region', 'amount'] }, 'sales.csv')

    expect(notice?.headline).toBe('sales.csv is missing 2 columns this link expects.')
    expect(notice?.detail).toContain('Missing: region, amount')
  })

  it('says column, singular, for one', () => {
    const notice = matchNotice({ status: 'incomplete', missing: ['region'] }, 'sales.csv')

    expect(notice?.headline).toContain('missing 1 column this')
  })

  it('says the query may still run, because it may', () => {
    const notice = matchNotice({ status: 'incomplete', missing: ['region'] }, 'sales.csv')

    expect(notice?.detail).toContain('may still run')
  })

  it('counts the rest rather than listing forty names', () => {
    const missing = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const notice = matchNotice({ status: 'incomplete', missing }, 'sales.csv')

    expect(notice?.detail).toContain('Missing: a, b, c, d, e, f, and 2 more')
  })

  it('lists them all when they fit', () => {
    const missing = ['a', 'b', 'c', 'd', 'e', 'f']
    const notice = matchNotice({ status: 'incomplete', missing }, 'sales.csv')

    expect(notice?.detail).toContain('Missing: a, b, c, d, e, f.')
  })
})
