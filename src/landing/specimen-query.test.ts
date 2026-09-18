import { describe, expect, it } from 'vitest'

import { DATASET_VIEW } from '../dataset/ingest-sql'
import { specimenQuery } from './specimen-query'

describe('specimenQuery', () => {
  it('bounds the week half-open so consecutive weeks tile', () => {
    const first = specimenQuery('Coffee', 0, '2024-01-01')
    const second = specimenQuery('Coffee', 1, '2024-01-01')

    expect(first).toContain("date >= '2024-01-01'")
    expect(first).toContain("date < '2024-01-08'")
    // The day that ends one week opens the next, and is counted once.
    expect(second).toContain("date >= '2024-01-08'")
  })

  it('names the category it was read from', () => {
    expect(specimenQuery('Sandwich', 3, '2024-01-01')).toContain("category = 'Sandwich'")
  })

  // The category comes out of the reader's file, so it is data. An apostrophe
  // in a name would otherwise close the literal and hand DuckDB a broken query.
  it('escapes a quote in a category name rather than breaking the literal', () => {
    const sql = specimenQuery("Bob's Blend", 0, '2024-01-01')
    expect(sql).toContain("category = 'Bob''s Blend'")
  })

  // The sheet's whole claim is that a reading hands over SQL that runs, and a
  // query naming a view that does not exist fails in the binder instead.
  it('selects from the view a loaded dataset is registered as', () => {
    expect(specimenQuery('Tea', 0, '2024-01-01')).toContain(`FROM ${DATASET_VIEW}`)
  })

  it('selects the columns the sheet drew', () => {
    const sql = specimenQuery('Tea', 0, '2024-01-01')
    expect(sql.startsWith('SELECT date, category, revenue')).toBe(true)
    expect(sql).toContain('ORDER BY date')
  })
})
