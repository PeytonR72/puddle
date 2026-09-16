import { describe, expect, it } from 'vitest'

import { DATASET_VIEW } from '../dataset/ingest-sql'
import { DEFAULT_QUERY, seedQuery } from './default-query'

describe('DEFAULT_QUERY', () => {
  it('selects from the view every dataset is registered under', () => {
    expect(DEFAULT_QUERY).toBe(`SELECT * FROM ${DATASET_VIEW} LIMIT 100`)
  })
})

describe('seedQuery', () => {
  it('seeds an empty editor', () => {
    expect(seedQuery('')).toBe(DEFAULT_QUERY)
  })

  it('seeds an editor holding only whitespace', () => {
    expect(seedQuery('  \n\t ')).toBe(DEFAULT_QUERY)
  })

  it('leaves a written query alone', () => {
    expect(seedQuery('SELECT count(*) FROM data')).toBe('SELECT count(*) FROM data')
  })

  it('leaves a query alone even when it is only a fragment', () => {
    expect(seedQuery('SELECT ')).toBe('SELECT ')
  })
})
